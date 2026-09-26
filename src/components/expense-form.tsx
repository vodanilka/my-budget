"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Expense, ExpenseSource, ExpenseType, ForWho, WhoBuy } from "@/lib/types";
import { categoriesForType } from "@/lib/formulas";
import { cardLabel, categoryLabel, personLabel, typeLabel } from "@/lib/labels";
import { toISODate } from "@/lib/format";
import { useBudget } from "@/lib/store";

export interface ExpenseDraft {
  date: string;
  type: ExpenseType;
  category: string;
  description: string;
  amount: string;
  whoBuy: WhoBuy;
  forWho: ForWho;
  card: string | null;
  free: boolean;
  source: ExpenseSource;
  receiptImage?: string | null;
  bankAccountId?: string | null;
}

export function draftFromExpense(e: Partial<Expense>): ExpenseDraft {
  return {
    date: e.date || toISODate(new Date()),
    type: (e.type as ExpenseType) || "Personal",
    category: e.category || "Food & Groceries",
    description: e.description || "",
    amount: e.amount != null ? String(e.amount) : "",
    whoBuy: (e.whoBuy as WhoBuy) || "Danil",
    forWho: (e.forWho as ForWho) || "Danil",
    card: e.card ?? null,
    free: Boolean(e.free),
    source: (e.source as ExpenseSource) || "manual",
    receiptImage: e.receiptImage,
    bankAccountId: e.bankAccountId,
  };
}

const field = "h-12 w-full rounded-xl text-base";

export function ExpenseForm({
  initial,
  submitLabel = "Сохранить в бюджет",
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Expense>;
  submitLabel?: string;
  onSubmit: (expense: Omit<Expense, "id">) => void;
  onCancel?: () => void;
}) {
  const { lists } = useBudget();
  const [draft, setDraft] = useState<ExpenseDraft>(() => draftFromExpense(initial ?? {}));
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => categoriesForType(draft.type, lists),
    [draft.type, lists]
  );

  function patch<K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "type") {
        const cats = categoriesForType(String(value), lists);
        if (!cats.includes(d.category)) next.category = cats[0];
      }
      return next;
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(String(draft.amount).replace(",", "."));
    if (!draft.date) {
      setError("Укажите дату");
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      setError("Сумма должна быть числом, не ноль");
      return;
    }
    if (!draft.category) {
      setError("Выберите категорию из списка таблицы");
      return;
    }
    setError(null);
    onSubmit({
      date: draft.date,
      type: draft.type,
      category: draft.category,
      description: draft.description.trim() || null,
      amount,
      whoBuy: draft.whoBuy,
      forWho: draft.forWho,
      card: draft.card,
      free: draft.free,
      source: draft.source,
      receiptImage: draft.receiptImage,
      bankAccountId: draft.bankAccountId,
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">Дата</Label>
          <Input
            id="date"
            type="date"
            className={field}
            value={draft.date}
            onChange={(e) => patch("date", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Сумма, $</Label>
          <Input
            id="amount"
            inputMode="decimal"
            className={field}
            placeholder="0.00"
            value={draft.amount}
            onChange={(e) => patch("amount", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Тип</Label>
        <Select
          value={draft.type}
          onValueChange={(v) => v && patch("type", v as ExpenseType)}
        >
          <SelectTrigger className={field}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lists.types.map((t) => (
              <SelectItem key={t} value={t}>
                {typeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Категория</Label>
        <Select
          value={draft.category}
          onValueChange={(v) => v && patch("category", v)}
        >
          <SelectTrigger className={field}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="desc">Описание</Label>
        <Input
          id="desc"
          className={field}
          placeholder="WinCo, Avem, Gas…"
          value={draft.description}
          onChange={(e) => patch("description", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Кто купил</Label>
          <Select
            value={draft.whoBuy}
            onValueChange={(v) => v && patch("whoBuy", v as WhoBuy)}
          >
            <SelectTrigger className={field}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lists.whoBuy.map((p) => (
                <SelectItem key={p} value={p}>
                  {personLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Для кого</Label>
          <Select
            value={draft.forWho}
            onValueChange={(v) => v && patch("forWho", v as ForWho)}
          >
            <SelectTrigger className={field}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lists.forWho.map((p) => (
                <SelectItem key={p} value={p}>
                  {personLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Карта</Label>
        <Select
          value={draft.card ?? "none"}
          onValueChange={(v) => patch("card", !v || v === "none" ? null : v)}
        >
          <SelectTrigger className={field}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без карты</SelectItem>
            {lists.cards.map((c) => (
              <SelectItem key={c} value={c}>
                {cardLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3">
        <Checkbox
          checked={draft.free}
          onCheckedChange={(v) => patch("free", Boolean(v))}
        />
        <span className="text-sm">
          FREE? — не делить с Владом (как SNAP / «yes» в таблице)
        </span>
      </label>
      <div className="mt-2 flex flex-col gap-2">
        <Button type="submit" size="lg" className="h-12 w-full text-base">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full"
            onClick={onCancel}
          >
            Отмена
          </Button>
        ) : null}
      </div>
    </form>
  );
}
