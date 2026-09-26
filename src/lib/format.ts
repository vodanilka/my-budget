import { MONTHS_RU } from "./labels";

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return money.format(v);
}

export function formatMoneyAbs(n: number) {
  return formatMoney(Math.abs(n));
}

export function formatSigned(n: number) {
  if (n > 0.005) return `+${formatMoney(n)}`;
  if (n < -0.005) return `−${formatMoney(Math.abs(n))}`;
  return formatMoney(0);
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function monthKey(iso: string | null | undefined) {
  if (!iso || iso.length < 7) return "";
  return iso.slice(0, 7);
}

export function formatDay(iso: string | null | undefined) {
  if (!iso) return "Без даты";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_RU[m - 1].slice(0, 3)}`;
}

export function formatFullDate(iso: string | null | undefined) {
  if (!iso) return "Без даты";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS_RU[m - 1]} ${y}`;
}

export function monthBounds(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

export function inMonth(date: string | null | undefined, ym: string) {
  if (!date) return false;
  return monthKey(date) === ym;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
