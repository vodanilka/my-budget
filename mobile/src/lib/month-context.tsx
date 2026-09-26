import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { latestDataMonth } from "./formulas";
import { useBudget } from "./store";

interface MonthCtx {
  month: string;
  setMonth: (m: string) => void;
}

const Ctx = createContext<MonthCtx | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  const { expenses, ready } = useBudget();
  const fallback = latestDataMonth(expenses);
  const [month, setMonth] = useState(fallback);
  const value = useMemo(() => {
    const current = ready ? month || fallback : fallback;
    return { month: current, setMonth };
  }, [month, fallback, ready]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMonth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMonth must be used within MonthProvider");
  return ctx;
}
