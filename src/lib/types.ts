export type ExpenseType = "Personal" | "Business";
export type WhoBuy = "Danil" | "Vlad" | "SNAP";
export type ForWho = "Danil" | "Vlad" | "Both";
export type WhoWorks = "Danil" | "Vlad" | "Both";
export type ExpenseSource = "sheet" | "bank" | "receipt" | "manual";

export interface Expense {
  id: string;
  date: string;
  type: ExpenseType | string;
  category: string;
  description: string | null;
  amount: number;
  whoBuy: WhoBuy | string;
  forWho: ForWho | string;
  free: boolean;
  card: string | null;
  source: ExpenseSource | string;
  receiptImage?: string | null;
  bankAccountId?: string | null;
}

export interface SalaryJob {
  id: string;
  date: string | null;
  total: number;
  labor: number;
  materials: number;
  fee: number;
  percentage: number | null;
  customer: string | number | null;
  whoWorks: WhoWorks | string | null;
  vladSalary: number;
  danilSalary: number;
}

export interface Transfer {
  id: string;
  date: string | null;
  amount: number;
  description: string | null;
}

export interface BudgetLine {
  day: number | string | null;
  name: string;
  amount: number;
  note: string | null;
  extra: string | null;
}

export interface Bill {
  day: number | null;
  name: string;
  amount: number;
  note: string | null;
}

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  creditLine: number;
  minPay: number | null;
  schedule: string | null;
}

export interface MonthReport {
  month: string;
  danilSalary: number;
  vladSalary: number;
  sentVlad: number;
  danilForVlad: number;
  vladForDanil: number;
  net: number;
  debt: number;
}

export interface AnalyticsRow {
  month: string;
  total: number;
  byCategory: Record<string, number>;
}

export interface Lists {
  types: string[];
  whoBuy: string[];
  forWho: string[];
  personalCategories: string[];
  businessCategories: string[];
  cards: string[];
}

export interface BankAccount {
  id: string;
  institutionId: string;
  institutionName: string;
  name: string;
  mask: string;
  type: "checking" | "savings" | "credit" | "cash";
  card: string | null;
  balance: number;
  connectedAt: string;
}

export interface BankInstitution {
  id: string;
  name: string;
  shortName: string;
  color: string;
  cards: string[];
  accounts: {
    name: string;
    mask: string;
    type: BankAccount["type"];
    card: string | null;
    balance: number;
  }[];
}

export interface SeedData {
  workbook: string;
  sheets: string[];
  lists: Lists;
  expenses: Expense[];
  salary: SalaryJob[];
  sentToVlad: Transfer[];
  monthlyBudget: BudgetLine[];
  bills: Bill[];
  creditCards: CreditCard[];
  transactionFees: { month: string; summ: number; fee: number }[];
  reports: MonthReport[];
  analytics: Record<string, AnalyticsRow[]>;
}

export interface AppState {
  expenses: Expense[];
  salary: SalaryJob[];
  sentToVlad: Transfer[];
  accounts: BankAccount[];
  dismissedInstall: boolean;
}
