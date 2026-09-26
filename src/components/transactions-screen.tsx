"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ExpenseForm } from "@/components/expense-form";
import { MonthPicker } from "@/components/month-picker";
import { EmptyState, ScreenSkeleton } from "@/components/states";
import { expensesInMonth } from "@/lib/formulas";
import { cardLabel, categoryLabel, personLabel, typeLabel } from "@/lib/labels";
import { formatDay, formatMoney } from "@/lib/format";
import { useMonth } from "@/lib/month-context";
import { useBudget } from "@/lib/store";
import type { Expense } from "@/lib/types";

export function TransactionsScreen() {
  const { ready, expenses, lists, addExpense, updateExpense, removeExpense } = useBudget();
  const { month } = useMonth();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [who, setWho] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return expensesInMonth(expenses, month)
      .filter((e) => (type === "all" ? true : e.type === type))
      .filter((e) => (who === "all" ? true : e.whoBuy === who))
      .filter((e) => {
        if (!needle) return true;
        return `${e.description ?? ""} ${e.category} ${e.card ?? ""}`
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [expenses, month, q, type, who]);

  const total = rows.reduce((a, e) => a + (e.amount || 0), 0);

  if (!ready) return <ScreenSkeleton />;

  return (
    <div className="px-4 pb-8" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Операции</h1>
        <Button
          size="lg"
          className="h-11 rounded-full"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>
      <MonthPicker />
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Лист Expenses · {rows.length} шт. · {formatMoney(total)}
      </p>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 rounded-xl pl-9 text-base"
          placeholder="Поиск: WinCo, Gas, Avem…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <Select value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger className="h-11 flex-1 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {lists.types.map((t) => (
              <SelectItem key={t} value={t}>
                {typeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={who} onValueChange={(v) => v && setWho(v)}>
          <SelectTrigger className="h-11 flex-1 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Кто угодно</SelectItem>
            {lists.whoBuy.map((p) => (
              <SelectItem key={p} value={p}>
                {personLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <EmptyState
            title={q || type !== "all" ? "Ничего не нашли" : "Нет операций"}
            text="За этот месяц в таблице Expenses пусто. Добавьте вручную, из банка или с чека."
            action={
              <Button className="h-11" onClick={() => setOpen(true)}>
                Новая операция
              </Button>
            }
          />
        ) : (
          rows.map((e) => (
            <button
              type="button"
              key={e.id}
              onClick={() => {
                setEditing(e);
                setOpen(true);
              }}
              className="flex w-full items-start justify-between gap-3 rounded-2xl bg-card px-3 py-3 text-left ring-1 ring-foreground/8"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {e.description || categoryLabel(e.category)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDay(e.date)} · {categoryLabel(e.category)} ·{" "}
                  {personLabel(String(e.whoBuy))} → {personLabel(String(e.forWho))}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary">{typeLabel(String(e.type))}</Badge>
                  {e.card ? <Badge variant="outline">{cardLabel(e.card)}</Badge> : null}
                  {e.free ? <Badge variant="outline">FREE</Badge> : null}
                  {e.source === "receipt" ? <Badge>Чек</Badge> : null}
                  {e.source === "bank" ? <Badge>Банк</Badge> : null}
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatMoney(e.amount)}
              </p>
            </button>
          ))
        )}
      </div>

      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader>
            <DrawerTitle>
              {editing ? "Операция" : "Новая операция"}
            </DrawerTitle>
            <DrawerDescription>
              Поля как на листе Form: дата, тип, категория, описание, сумма, кто купил, для кого, карта.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <ExpenseForm
              key={editing?.id ?? "new"}
              initial={editing ?? { source: "manual" }}
              submitLabel={editing ? "Сохранить" : "Добавить в Expenses"}
              onCancel={() => setOpen(false)}
              onSubmit={(row) => {
                if (editing) {
                  updateExpense(editing.id, row);
                } else {
                  addExpense(row);
                }
                setOpen(false);
              }}
            />
            {editing && editing.source !== "sheet" ? (
              <Button
                variant="destructive"
                className="mt-2 h-11 w-full"
                onClick={() => {
                  removeExpense(editing.id);
                  setOpen(false);
                }}
              >
                Удалить
              </Button>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
