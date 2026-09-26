"use client";

import { useEffect, type ReactNode } from "react";
import { BudgetProvider } from "@/lib/store";
import { MonthProvider } from "@/lib/month-context";
import { BottomNav } from "@/components/bottom-nav";

function registerSw() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerSw();
  }, []);
  return (
    <BudgetProvider>
      <MonthProvider>
        <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background md:max-w-4xl md:shadow-2xl">
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </div>
      </MonthProvider>
    </BudgetProvider>
  );
}
