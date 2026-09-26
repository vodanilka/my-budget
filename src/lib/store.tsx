"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import seedJson from "@/data/seed.json";
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
const CHANGE = "budget-vf-change";
const seed = seedJson as SeedData;
const SERVER_STATE: AppState = {
  expenses: seed.expenses as Expense[],
  salary: seed.salary as SalaryJob[],
  sentToVlad: seed.sentToVlad as Transfer[],
  accounts: [],
  dismissedInstall: false,
};

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
  dismissedInstall: boolean;
  addExpense: (e: Omit<Expense, "id"> & { id?: string }) => Expense;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  connectAccounts: (accounts: Omit<BankAccount, "connectedAt">[]) => void;
  disconnectAccount: (id: string) => void;
  importBankTransactions: (items: Omit<Expense, "id">[]) => number;
  dismissInstall: () => void;
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

let memory: AppState | null = null;
let persistError: string | null = null;

function readClient(): AppState {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memory = raw ? mergeLoaded(JSON.parse(raw) as Partial<AppState>) : baseState();
  } catch {
    persistError = "Не удалось прочитать сохранённые данные";
    memory = baseState();
  }
  return memory;
}

function write(next: AppState) {
  memory = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    persistError = null;
  } catch {
    persistError = "Не хватает места, чтобы сохранить изменения";
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerSnapshot() {
  return SERVER_STATE;
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, readClient, getServerSnapshot);
  const error = persistError;

  const setState = useCallback((updater: AppState | ((s: AppState) => AppState)) => {
    const curr = readClient();
    write(typeof updater === "function" ? updater(curr) : updater);
  }, []);

  const addExpense = useCallback((e: Omit<Expense, "id"> & { id?: string }) => {
    const row: Expense = { ...e, id: e.id ?? uid("exp") };
    setState((s) => ({ ...s, expenses: [row, ...s.expenses] }));
    return row;
  }, [setState]);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, [setState]);

  const removeExpense = useCallback((id: string) => {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  }, [setState]);

  const connectAccounts = useCallback(
    (accounts: Omit<BankAccount, "connectedAt">[]) => {
      const connectedAt = new Date().toISOString();
      setState((s) => {
        const existing = new Set(s.accounts.map((a) => a.id));
        const next = accounts
          .filter((a) => !existing.has(a.id))
          .map((a) => ({ ...a, connectedAt }));
        return { ...s, accounts: [...s.accounts, ...next] };
      });
    },
    [setState]
  );

  const disconnectAccount = useCallback((id: string) => {
    setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
  }, [setState]);

  const importBankTransactions = useCallback((items: Omit<Expense, "id">[]) => {
    const rows = items.map((e) => ({ ...e, id: uid("bnk") }));
    setState((s) => ({ ...s, expenses: [...rows, ...s.expenses] }));
    return rows.length;
  }, [setState]);

  const dismissInstall = useCallback(() => {
    setState((s) => ({ ...s, dismissedInstall: true }));
  }, [setState]);

  const resetToSheet = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    write(baseState());
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready: true,
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
      dismissedInstall: state.dismissedInstall,
      addExpense,
      updateExpense,
      removeExpense,
      connectAccounts,
      disconnectAccount,
      importBankTransactions,
      dismissInstall,
      resetToSheet,
    }),
    [
      error,
      state,
      addExpense,
      updateExpense,
      removeExpense,
      connectAccounts,
      disconnectAccount,
      importBankTransactions,
      dismissInstall,
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
