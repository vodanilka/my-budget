import type { BankInstitution } from "./types";

/** Institutions mapped to Lists!Card and Danil Credit Card sheet. */
export const INSTITUTIONS: BankInstitution[] = [
  {
    id: "bofa",
    name: "Bank of America",
    shortName: "BoFa",
    color: "#012169",
    cards: ["Personal BoFa", "BoFa business"],
    accounts: [
      {
        name: "Advantage Plus",
        mask: "4412",
        type: "checking",
        card: "Personal BoFa",
        balance: 1840.22,
      },
      {
        name: "Business Advantage",
        mask: "7781",
        type: "checking",
        card: "BoFa business",
        balance: 3920.1,
      },
    ],
  },
  {
    id: "square",
    name: "Square / Block",
    shortName: "Square",
    color: "#3E3E3E",
    cards: ["Square"],
    accounts: [
      {
        name: "Square checking",
        mask: "9021",
        type: "checking",
        card: "Square",
        balance: 1264.55,
      },
    ],
  },
  {
    id: "ollo",
    name: "Ollo Card",
    shortName: "Ollo",
    color: "#6B4EFF",
    cards: ["Ollo"],
    accounts: [
      {
        name: "Ollo Visa",
        mask: "2500",
        type: "credit",
        card: "Ollo",
        balance: -2381.92,
      },
    ],
  },
  {
    id: "mission",
    name: "Mission Lane",
    shortName: "Mission Lane",
    color: "#0F766E",
    cards: ["Mission lane"],
    accounts: [
      {
        name: "Mission Lane Visa",
        mask: "1616",
        type: "credit",
        card: "Mission lane",
        balance: -1931.79,
      },
    ],
  },
  {
    id: "kikoff",
    name: "Kikoff",
    shortName: "Kikoff",
    color: "#EA580C",
    cards: ["Kikoff"],
    accounts: [
      {
        name: "Kikoff Credit",
        mask: "0200",
        type: "credit",
        card: "Kikoff",
        balance: -197,
      },
    ],
  },
  {
    id: "reliable",
    name: "Reliable Credit",
    shortName: "Reliable",
    color: "#9A3412",
    cards: [],
    accounts: [
      {
        name: "Car loan",
        mask: "8572",
        type: "credit",
        card: null,
        balance: -7810.02,
      },
    ],
  },
  {
    id: "houzz",
    name: "Houzz / Stripe",
    shortName: "Houzz",
    color: "#147B45",
    cards: ["Square"],
    accounts: [
      {
        name: "Houzz capital",
        mask: "5984",
        type: "credit",
        card: null,
        balance: -1071.31,
      },
    ],
  },
  {
    id: "cash",
    name: "Наличные",
    shortName: "Cash",
    color: "#3F6212",
    cards: ["Cash"],
    accounts: [
      {
        name: "Кошелёк",
        mask: "cash",
        type: "cash",
        card: "Cash",
        balance: 240,
      },
    ],
  },
];

export const SANDBOX_LOGIN = {
  user: "user_good",
  password: "pass_good",
};

export interface MockBankTx {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: "Personal" | "Business";
}

export function mockTransactionsFor(institutionId: string): MockBankTx[] {
  const today = new Date();
  const iso = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };
  const byInst: Record<string, MockBankTx[]> = {
    bofa: [
      { date: iso(1), description: "WinCo", amount: 86.4, category: "Food & Groceries", type: "Personal" },
      { date: iso(2), description: "Pacific Power", amount: 143.2, category: "Utilities & Bills", type: "Personal" },
      { date: iso(4), description: "7 eleven", amount: 21.66, category: "Cigarettes", type: "Personal" },
      { date: iso(5), description: "Geico", amount: 206.23, category: "Transportation", type: "Personal" },
      { date: iso(8), description: "Xfinity", amount: 65, category: "Utilities & Bills", type: "Personal" },
    ],
    square: [
      { date: iso(0), description: "Square payout Liz 537", amount: -1257.77, category: "Transaction Fee", type: "Business" },
      { date: iso(3), description: "Transaction fee", amount: 43.23, category: "Transaction Fee", type: "Business" },
      { date: iso(6), description: "Avem", amount: 56.54, category: "Materials", type: "Business" },
    ],
    ollo: [
      { date: iso(2), description: "Amazon", amount: 48.19, category: "Supplies", type: "Business" },
      { date: iso(7), description: "Apple Music", amount: 16.99, category: "Utilities & Bills", type: "Personal" },
    ],
    mission: [
      { date: iso(6), description: "Mission Lane payment", amount: 200, category: "Loan", type: "Business" },
    ],
    kikoff: [
      { date: iso(1), description: "Kikoff", amount: 20, category: "Utilities & Bills", type: "Personal" },
    ],
    reliable: [
      { date: iso(12), description: "Reliable Credit car", amount: 368.42, category: "Loan", type: "Personal" },
    ],
    houzz: [
      { date: iso(20), description: "HouzzPro", amount: 0, category: "Marketing & Subscription", type: "Business" },
    ],
    cash: [
      { date: iso(1), description: "7 eleven cash", amount: 21.66, category: "Cigarettes", type: "Personal" },
    ],
  };
  return byInst[institutionId] ?? [];
}
