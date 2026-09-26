import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Expense, ExpenseSource, ExpenseType, ForWho, WhoBuy } from "../lib/types";
import { categoriesForType } from "../lib/formulas";
import { cardLabel, categoryLabel, personLabel, typeLabel } from "../lib/labels";
import { toISODate } from "../lib/format";
import { useBudget } from "../lib/store";
import { colors, radius } from "../theme";
import { Button, FieldLabel, Sheet } from "./ui";

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
  const [picker, setPicker] = useState<null | "type" | "category" | "whoBuy" | "forWho" | "card">(
    null
  );

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

  function submit() {
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

  const pickerOptions = (): { value: string; label: string }[] => {
    if (picker === "type") return lists.types.map((t) => ({ value: t, label: typeLabel(t) }));
    if (picker === "category")
      return categories.map((c) => ({ value: c, label: categoryLabel(c) }));
    if (picker === "whoBuy")
      return lists.whoBuy.map((p) => ({ value: p, label: personLabel(p) }));
    if (picker === "forWho")
      return lists.forWho.map((p) => ({ value: p, label: personLabel(p) }));
    if (picker === "card")
      return [
        { value: "none", label: "Без карты" },
        ...lists.cards.map((c) => ({ value: c, label: cardLabel(c) })),
      ];
    return [];
  };

  return (
    <View style={{ gap: 12 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        <View style={styles.col}>
          <FieldLabel>Дата</FieldLabel>
          <TextInput
            style={styles.input}
            value={draft.date}
            placeholder="ГГГГ-ММ-ДД"
            placeholderTextColor={colors.mutedFg}
            onChangeText={(v) => patch("date", v)}
          />
        </View>
        <View style={styles.col}>
          <FieldLabel>Сумма, $</FieldLabel>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.mutedFg}
            value={draft.amount}
            onChangeText={(v) => patch("amount", v)}
          />
        </View>
      </View>
      <SelectField
        label="Тип"
        value={typeLabel(draft.type)}
        onPress={() => setPicker("type")}
      />
      <SelectField
        label="Категория"
        value={categoryLabel(draft.category)}
        onPress={() => setPicker("category")}
      />
      <View>
        <FieldLabel>Описание</FieldLabel>
        <TextInput
          style={styles.input}
          placeholder="WinCo, Avem, Gas…"
          placeholderTextColor={colors.mutedFg}
          value={draft.description}
          onChangeText={(v) => patch("description", v)}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.col}>
          <SelectField
            label="Кто купил"
            value={personLabel(draft.whoBuy)}
            onPress={() => setPicker("whoBuy")}
          />
        </View>
        <View style={styles.col}>
          <SelectField
            label="Для кого"
            value={personLabel(draft.forWho)}
            onPress={() => setPicker("forWho")}
          />
        </View>
      </View>
      <SelectField
        label="Карта"
        value={cardLabel(draft.card)}
        onPress={() => setPicker("card")}
      />
      <Pressable
        onPress={() => patch("free", !draft.free)}
        style={styles.checkRow}
      >
        <View style={[styles.box, draft.free && styles.boxOn]}>
          {draft.free ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <Text style={styles.checkText}>
          FREE? — не делить с Владом (как SNAP / «yes» в таблице)
        </Text>
      </Pressable>
      <Button label={submitLabel} onPress={submit} />
      {onCancel ? <Button label="Отмена" variant="ghost" onPress={onCancel} /> : null}

      <Sheet
        open={picker != null}
        onClose={() => setPicker(null)}
        title="Выберите"
      >
        {pickerOptions().map((opt) => (
          <Pressable
            key={opt.value}
            style={styles.opt}
            onPress={() => {
              if (picker === "type") patch("type", opt.value as ExpenseType);
              if (picker === "category") patch("category", opt.value);
              if (picker === "whoBuy") patch("whoBuy", opt.value as WhoBuy);
              if (picker === "forWho") patch("forWho", opt.value as ForWho);
              if (picker === "card") patch("card", opt.value === "none" ? null : opt.value);
              setPicker(null);
            }}
          >
            <Text style={styles.optText}>{opt.label}</Text>
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}

function SelectField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <Pressable onPress={onPress} style={styles.input}>
        <Text style={{ color: colors.fg, fontSize: 16 }}>{value}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    justifyContent: "center",
    fontSize: 16,
    color: colors.fg,
  },
  error: {
    backgroundColor: "#FDECEC",
    color: colors.danger,
    padding: 10,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  checkRow: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.primary },
  checkMark: { color: colors.primaryFg, fontWeight: "700" },
  checkText: { flex: 1, fontSize: 13, color: colors.fg },
  opt: {
    minHeight: 48,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optText: { fontSize: 16, color: colors.fg },
});
