import type { BudgetLine, Expense, SalaryJob, Transfer } from "./types";
import { inMonth, monthKey, round2 } from "./format";

function isFree(e: Expense) {
  return e.free === true;
}

export function categoriesForType(
  type: string,
  lists: { personalCategories: string[]; businessCategories: string[] }
) {
  return type === "Business" ? lists.businessCategories : lists.personalCategories;
}

/** Labor = Summ − Materials − Fee. Vlad share: 0 if Danil, 100% if Vlad, else Percentage or 35%. */
export function splitSalary(input: {
  total: number;
  materials: number;
  fee: number;
  whoWorks: string | null;
  percentage: number | null;
}) {
  const labor = round2(input.total - (input.materials || 0) - (input.fee || 0));
  let vlad = 0;
  if (input.whoWorks === "Danil") vlad = 0;
  else if (input.whoWorks === "Vlad") vlad = labor;
  else {
    const p = input.percentage == null ? 0.35 : input.percentage;
    vlad = round2(labor * p);
  }
  return { labor, vladSalary: vlad, danilSalary: round2(labor - vlad) };
}

export function sumWhere(expenses: Expense[], pred: (e: Expense) => boolean) {
  return round2(expenses.reduce((acc, e) => (pred(e) ? acc + (e.amount || 0) : acc), 0));
}

export function expensesInMonth(expenses: Expense[], ym: string) {
  return expenses.filter((e) => inMonth(e.date, ym));
}

/** Reports!B: DanilSalary − Labor & Subcontractors that month. */
export function reportDanilSalary(
  ym: string,
  salary: SalaryJob[],
  expenses: Expense[]
) {
  const fromJobs = salary
    .filter((s) => inMonth(s.date, ym))
    .reduce((a, s) => a + (s.danilSalary || 0), 0);
  const laborSub = sumWhere(
    expenses,
    (e) => inMonth(e.date, ym) && e.category === "Labor & Subcontractors"
  );
  return round2(fromJobs - laborSub);
}

export function reportVladSalary(ym: string, salary: SalaryJob[]) {
  return round2(
    salary.filter((s) => inMonth(s.date, ym)).reduce((a, s) => a + (s.vladSalary || 0), 0)
  );
}

export function reportSentVlad(ym: string, sent: Transfer[]) {
  return round2(
    sent.filter((s) => inMonth(s.date, ym)).reduce((a, s) => a + (s.amount || 0), 0)
  );
}

/**
 * Reports!E header "Danil for Vlad":
 * Vlad→Danil + half of Vlad→Both, excluding FREE? = Yes.
 */
export function reportColE(expenses: Expense[], ym: string) {
  const vToD = sumWhere(
    expenses,
    (e) =>
      inMonth(e.date, ym) &&
      !isFree(e) &&
      e.whoBuy === "Vlad" &&
      e.forWho === "Danil"
  );
  const vBoth = sumWhere(
    expenses,
    (e) =>
      inMonth(e.date, ym) &&
      !isFree(e) &&
      e.whoBuy === "Vlad" &&
      e.forWho === "Both"
  );
  return round2(vToD + vBoth / 2);
}

/**
 * Reports!F header "Vlad for Danil":
 * Danil→Vlad + half of Danil→Both, excluding FREE? = Yes.
 */
export function reportColF(expenses: Expense[], ym: string) {
  const dToV = sumWhere(
    expenses,
    (e) =>
      inMonth(e.date, ym) &&
      !isFree(e) &&
      e.whoBuy === "Danil" &&
      e.forWho === "Vlad"
  );
  const dBoth = sumWhere(
    expenses,
    (e) =>
      inMonth(e.date, ym) &&
      !isFree(e) &&
      e.whoBuy === "Danil" &&
      e.forWho === "Both"
  );
  return round2(dToV + dBoth / 2);
}

/** Net = E − F. Debt = VladSalary − SentVlad + Net. Current = SUM of monthly debts. */
export function monthReport(
  ym: string,
  expenses: Expense[],
  salary: SalaryJob[],
  sent: Transfer[]
) {
  const danilSalary = reportDanilSalary(ym, salary, expenses);
  const vladSalary = reportVladSalary(ym, salary);
  const sentVlad = reportSentVlad(ym, sent);
  const danilForVlad = reportColE(expenses, ym);
  const vladForDanil = reportColF(expenses, ym);
  const net = round2(danilForVlad - vladForDanil);
  const debt = round2(vladSalary - sentVlad + net);
  return {
    month: ym,
    danilSalary,
    vladSalary,
    sentVlad,
    danilForVlad,
    vladForDanil,
    net,
    debt,
  };
}

export function shareWeight(forWho: string, person: "Danil" | "Vlad") {
  const fw = String(forWho).trim();
  if (fw === person) return 1;
  if (fw === "Both") return 0.5;
  return 0;
}

/** Analitics DANIL/VLAD: Personal × weight(forWho). BUSINESS: Type=Business full amount. */
export function analyticsFor(
  expenses: Expense[],
  ym: string,
  person: "Danil" | "Vlad" | "Business"
) {
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const e of expenses) {
    if (!inMonth(e.date, ym)) continue;
    let w = 0;
    if (person === "Business") {
      w = e.type === "Business" ? 1 : 0;
    } else if (e.type === "Personal") {
      w = shareWeight(e.forWho, person);
    }
    if (!w) continue;
    const amt = round2((e.amount || 0) * w);
    byCategory[e.category] = round2((byCategory[e.category] || 0) + amt);
    total = round2(total + amt);
  }
  return { total, byCategory };
}

export function budgetTotals(lines: BudgetLine[]) {
  const byName = (name: string) =>
    lines.find((l) => l.name.trim() === name)?.amount ?? 0;
  const total = round2(lines.reduce((a, l) => a + (l.amount || 0), 0));
  const pacific = byName("Pacific power");
  const xfinity = byName("Xfinity");
  const rentIns = byName("Rent insurance");
  const bizIns = byName("Business/incurance");
  const gym = byName("Subscription/gym");
  const houzz = byName("HouzzPro");
  const accounting = byName("Accounting");
  const progressive = byName("Progressive");
  const gas = byName("Gas");
  const carLoan = byName("Car loan");
  const livingWithVlad = round2(total - (pacific + xfinity + rentIns) / 2 - 51 - 705);
  const business = round2(bizIns + gym + houzz + accounting);
  const withoutCarBiz = round2(
    total - business - progressive - gas - carLoan - bizIns - gym
  );
  const withoutCarBizVlad = round2(
    livingWithVlad - business - progressive - gas - carLoan
  );
  return {
    total,
    livingWithVlad,
    business,
    withoutCarBiz,
    withoutCarBizVlad,
  };
}

export function availableMonths(expenses: Expense[], salary: SalaryJob[]) {
  const set = new Set<string>();
  for (const e of expenses) {
    const k = monthKey(e.date);
    if (k) set.add(k);
  }
  for (const s of salary) {
    const k = monthKey(s.date);
    if (k) set.add(k);
  }
  const now = new Date();
  set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  return [...set].sort();
}

export function latestDataMonth(expenses: Expense[]) {
  const months = expenses.map((e) => monthKey(e.date)).filter(Boolean).sort();
  return months[months.length - 1] ?? monthKey(new Date().toISOString());
}

export function upcomingBills(bills: { day: number | null; name: string; amount: number }[], today = new Date()) {
  const d = today.getDate();
  return [...bills]
    .filter((b) => typeof b.day === "number")
    .sort((a, b) => {
      const ad = a.day as number;
      const bd = b.day as number;
      const as = ad >= d ? ad : ad + 32;
      const bs = bd >= d ? bd : bd + 32;
      return as - bs;
    });
}
