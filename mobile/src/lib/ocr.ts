import { guessFromText } from "./merchants";
import { toISODate } from "./format";

export interface OcrFields {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  rawText: string;
  category: string | null;
  type: "Personal" | "Business" | null;
  confidence: number;
}

export const DEMO_RECEIPT_TEXT = `WINCO FOODS
PORTLAND, OR
Store #32  Tel 503-555-0199
03/15/2026  14:22  CSH 12
BANANAS ORG                 $4.29
MILK 1GAL                   $3.89
EGGS LARGE 18               $5.49
BREAD WHEAT                 $2.79
CHICKEN THIGH              $12.64
COFFEE GROUND               $8.99
PAPER TOWELS                $9.73
SUBTOTAL                   $47.82
TAX                         $0.00
TOTAL                      $47.82
Thank you for shopping WinCo`;

const TOTAL_RE =
  /(?:grand\s*)?(?:total|amount\s*due|баланс|итого|сумма)[:\s]*\$?\s*([0-9]+[.,][0-9]{2})/i;
const MONEY_RE = /\$\s*([0-9]{1,4}(?:[.,][0-9]{3})*[.,][0-9]{2})/g;
const DATE_RE =
  /\b([0-3]?\d)[.\/-]([0-1]?\d)[.\/-]((?:20)?\d{2})\b|\b([0-1]?\d)[.\/-]([0-3]?\d)[.\/-]((?:20)?\d{2})\b/;

function parseMoney(s: string) {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function parseDate(text: string) {
  const m = text.match(DATE_RE);
  if (!m) return null;
  let day: number, month: number, year: number;
  if (m[1] && Number(m[1]) > 12) {
    day = Number(m[1]);
    month = Number(m[2]);
    year = Number(m[3]);
  } else if (m[4]) {
    month = Number(m[4]);
    day = Number(m[5]);
    year = Number(m[6]);
  } else {
    day = Number(m[1]);
    month = Number(m[2]);
    year = Number(m[3]);
  }
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function merchantFromLines(lines: string[]) {
  const skip =
    /receipt|store|thank|visa|mastercard|debit|change|cashier|тел|www|http|tax|subtotal/i;
  for (const line of lines.slice(0, 8)) {
    const t = line.trim();
    if (t.length < 3 || t.length > 40) continue;
    if (/^[0-9$\u20ac]/.test(t)) continue;
    if (skip.test(t)) continue;
    if (/[a-zA-Zа-яА-Я]/.test(t)) return t.replace(/\s+/g, " ");
  }
  return null;
}

export function parseReceiptText(rawText: string): OcrFields {
  const text = rawText.replace(/\u00a0/g, " ");
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let amount: number | null = null;
  const totalMatch = text.match(TOTAL_RE);
  if (totalMatch) amount = parseMoney(totalMatch[1]);
  if (amount == null) {
    const money: number[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(MONEY_RE.source, "g");
    while ((m = re.exec(text))) {
      const v = parseMoney(m[1]);
      if (v != null && v >= 0.5 && v < 20000) money.push(v);
    }
    if (money.length) amount = Math.max(...money);
  }

  const date = parseDate(text) ?? toISODate(new Date());
  const guessed = guessFromText(text);
  const merchant = guessed?.merchant ?? merchantFromLines(lines);

  return {
    merchant,
    amount,
    date,
    rawText: text,
    category: guessed?.category ?? null,
    type: guessed?.type ?? "Personal",
    confidence: [amount, merchant, guessed].filter(Boolean).length / 3,
  };
}

export function recognizeDemoReceipt(): OcrFields {
  return parseReceiptText(DEMO_RECEIPT_TEXT);
}
