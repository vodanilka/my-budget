"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { availableMonths } from "@/lib/formulas";
import { monthTitle } from "@/lib/labels";
import { useBudget } from "@/lib/store";
import { useMonth } from "@/lib/month-context";

export function MonthPicker() {
  const { expenses, salary } = useBudget();
  const { month, setMonth } = useMonth();
  const months = availableMonths(expenses, salary);
  const idx = Math.max(0, months.indexOf(month));
  const prev = months[idx - 1];
  const next = months[idx + 1];

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        className="size-11"
        disabled={!prev}
        onClick={() => prev && setMonth(prev)}
        aria-label="Предыдущий месяц"
      >
        <ChevronLeft className="size-5" />
      </Button>
      <p className="text-center text-base font-semibold tracking-tight">
        {monthTitle(month)}
      </p>
      <Button
        variant="ghost"
        size="icon-lg"
        className="size-11"
        disabled={!next}
        onClick={() => next && setMonth(next)}
        aria-label="Следующий месяц"
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
