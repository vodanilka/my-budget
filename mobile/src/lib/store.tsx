import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import seedMeta from "../data/seed-meta.json";
import expenses1 from "../data/seed-expenses-1.json";
import expenses2 from "../data/seed-expenses-2.json";
import expenses3 from "../data/seed-expenses-3.json";
import expenses4 from "../data/seed-expenses-4.json";
import expenses5 from "../data/seed-expenses-5.json";
import type {
  AppState,
  BankAccount,
  Expense,
  SalaryJob,
  SeedData,
  Transfer,
} from "./types";
import { uid } from "./format";

const STORAGE_KEY = "budget-vf-v1";
const seed = {
  ...(seedMeta as Omit<SeedData, "expenses">),
  expenses: [
    ...(expenses1 as Expense[]),
    ...(expenses2 as Expense[]),
    ...(expenses3 as Expense[]),
    ...(expenses4 as Expense[]),
    ...(expenses5 as Expense[]),
  ],
} as SeedData;

interface Store {
  ready: boolean;
  error: string | null;
  expenses: Expense[];
  salary: SalaryJob[];
  sentToVlad: Transfer[];
  accounts: BankAccount[];
  lists: SeedData["lists"];
  monthlyBudget: SeedData["monthlyBudget"];
  bills: SeedData["bills"];
  creditCards: SeedData["creditCards"];
  workbook: string;
  addExpense: (e: Omit<Expense, "id"> & { id?: string }) => Expense;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  connectAccounts: (accounts: Omit<BankAccount, "connectedAt">[]) => void;
  disconnectAccount: (id: string) => void;
  importBankTransactions: (items: Omit<Expense, "id">[]) => number;
  resetToSheet: () => void;
}

const Ctx = createContext<Store | null>(null);

function baseState(): AppState {
  return {
    expenses: seed.expenses as Expense[],
    salary: seed.salary as SalaryJob[],
    sentToVlad: seed.sentToVlad as Transfer[],
    accounts: [],
    dismissedInstall: false,
  };
}

function mergeLoaded(parsed: Partial<AppState>): AppState {
  const base = baseState();
  const extras = (parsed.expenses ?? []).filter(
    (e) => e.source && e.source !== "sheet"
  );
  const sheetIds = new Set(base.expenses.map((e) => e.id));
  const editedSheet = (parsed.expenses ?? []).filter(
    (e) => e.source === "sheet" && sheetIds.has(e.id)
  );
  const editedMap = new Map(editedSheet.map((e) => [e.id, e]));
  return {
    expenses: [
      ...base.expenses.map((e) => editedMap.get(e.id) ?? e),
      ...extras.filter((e) => !sheetIds.has(e.id)),
    ],
    salary: parsed.salary ?? base.salary,
    sentToVlad: parsed.sentToVlad ?? base.sentToVlad,
    accounts: parsed.accounts ?? [],
    dismissedInstall: parsed.dismissedInstall ?? false,
  };
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(baseState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) setState(mergeLoaded(JSON.parse(raw) as Partial<AppState>));
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось прочитать сохранённые данные");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((updater: AppState | ((s: AppState) => AppState)) => {
    setState((curr) => {
      const next = typeof updater === "function" ? updater(curr) : updater;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        setError("Не хватает места, чтобы сохранить изменения");
      });
      return next;
    });
  }, []);

  const addExpense = useCallback(
    (e: Omit<Expense, "id"> & { id?: string }) => {
      const row: Expense = { ...e, id: e.id ?? uid("exp") };
      persist((s) => ({ ...s, expenses: [row, ...s.expenses] }));
      return row;
    },
    [persist]
  );

  const updateExpense = useCallback(
    (id: string, patch: Partial<Expense>) => {
      persist((s) => ({
        ...s,
        expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    [persist]
  );

  const removeExpense = useCallback(
    (id: string) => {
      persist((s) => ({
        ...s,
        expenses: s.expenses.filter((e) => e.id !== id),
      }));
    },
    [persist]
  );

  const connectAccounts = useCallback(
    (accounts: Omit<BankAccount, "connectedAt">[]) => {
      const connectedAt = new Date().toISOString();
      persist((s) => {
        const existing = new Set(s.accounts.map((a) => a.id));
        const next = accounts
          .filter((a) => !existing.has(a.id))
          .map((a) => ({ ...a, connectedAt }));
        return { ...s, accounts: [...s.accounts, ...next] };
      });
    },
    [persist]
  );

  const disconnectAccount = useCallback(
    (id: string) => {
      persist((s) => ({
        ...s,
        accounts: s.accounts.filter((a) => a.id !== id),
      }));
    },
    [persist]
  );

  const importBankTransactions = useCallback(
    (items: Omit<Expense, "id">[]) => {
      const rows = items.map((e) => ({ ...e, id: uid("bnk") }));
      persist((s) => ({ ...s, expenses: [...rows, ...s.expenses] }));
      return rows.length;
    },
    [persist]
  );

  const resetToSheet = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    persist(baseState());
  }, [persist]);

  const value = useMemo<Store>(
    () => ({
      ready,
      error,
      expenses: state.expenses,
      salary: state.salary,
      sentToVlad: state.sentToVlad,
      accounts: state.accounts,
      lists: seed.lists,
      monthlyBudget: seed.monthlyBudget,
      bills: seed.bills,
      creditCards: seed.creditCards,
      workbook: seed.workbook,
      addExpense,
      updateExpense,
      removeExpense,
      connectAccounts,
      disconnectAccount,
      importBankTransactions,
      resetToSheet,
    }),
    [
      ready,
      error,
      state,
      addExpense,
      updateExpense,
      removeExpense,
      connectAccounts,
      disconnectAccount,
      importBankTransactions,
      resetToSheet,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBudget() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
