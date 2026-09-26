import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, EmptyState, ScreenSkeleton, Sheet } from "../components/ui";
import { ExpenseForm } from "../components/expense-form";
import { MonthPicker } from "../components/month-picker";
import { expensesInMonth } from "../lib/formulas";
import { cardLabel, categoryLabel, personLabel, typeLabel } from "../lib/labels";
import { formatDay, formatMoney } from "../lib/format";
import { useMonth } from "../lib/month-context";
import { useBudget } from "../lib/store";
import type { Expense } from "../lib/types";
import { colors, radius } from "../theme";

export function TransactionsScreen() {
  const { ready, expenses, lists, addExpense, updateExpense, removeExpense } = useBudget();
  const { month } = useMonth();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [who, setWho] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<null | "type" | "who">(null);

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
    <View style={styles.page}>
      <View style={styles.top}>
        <View style={styles.headRow}>
          <Text style={styles.h1}>Операции</Text>
          <Pressable
            style={styles.add}
            onPress={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Ionicons name="add" size={18} color={colors.primaryFg} />
            <Text style={styles.addText}>Добавить</Text>
          </Pressable>
        </View>
        <MonthPicker />
        <Text style={styles.meta}>
          Лист Expenses · {rows.length} шт. · {formatMoney(total)}
        </Text>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={colors.mutedFg} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск: WinCo, Gas, Avem…"
            placeholderTextColor={colors.mutedFg}
            value={q}
            onChangeText={setQ}
            autoCorrect={false}
          />
        </View>
        <View style={styles.filters}>
          <Pressable style={styles.filter} onPress={() => setFilter("type")}>
            <Text style={styles.filterText}>
              {type === "all" ? "Все типы" : typeLabel(type)}
            </Text>
          </Pressable>
          <Pressable style={styles.filter} onPress={() => setFilter("who")}>
            <Text style={styles.filterText}>
              {who === "all" ? "Кто угодно" : personLabel(who)}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }}>
        {rows.length === 0 ? (
          <EmptyState
            title={q || type !== "all" ? "Ничего не нашли" : "Нет операций"}
            text="За этот месяц в таблице Expenses пусто. Добавьте вручную, из банка или с чека."
            action={<Button label="Новая операция" onPress={() => setOpen(true)} />}
          />
        ) : (
          rows.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => {
                setEditing(e);
                setOpen(true);
              }}
              style={styles.row}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {e.description || categoryLabel(e.category)}
                </Text>
                <Text style={styles.sub}>
                  {formatDay(e.date)} · {categoryLabel(e.category)} ·{" "}
                  {personLabel(String(e.whoBuy))} → {personLabel(String(e.forWho))}
                </Text>
                <View style={styles.badges}>
                  <Badge label={typeLabel(String(e.type))} />
                  {e.card ? <Badge label={cardLabel(e.card)} tone="outline" /> : null}
                  {e.free ? <Badge label="FREE" tone="outline" /> : null}
                  {e.source === "receipt" ? <Badge label="Чек" tone="primary" /> : null}
                  {e.source === "bank" ? <Badge label="Банк" tone="primary" /> : null}
                </View>
              </View>
              <Text style={styles.amt}>{formatMoney(e.amount)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Операция" : "Новая операция"}
        description="Поля как на листе Form: дата, тип, категория, описание, сумма, кто купил, для кого, карта."
      >
        <ExpenseForm
          key={editing?.id ?? "new"}
          initial={editing ?? { source: "manual" }}
          submitLabel={editing ? "Сохранить" : "Добавить в Expenses"}
          onCancel={() => setOpen(false)}
          onSubmit={(row) => {
            if (editing) updateExpense(editing.id, row);
            else addExpense(row);
            setOpen(false);
          }}
        />
        {editing && editing.source !== "sheet" ? (
          <Button
            label="Удалить"
            variant="danger"
            onPress={() => {
              removeExpense(editing.id);
              setOpen(false);
            }}
          />
        ) : null}
      </Sheet>

      <Sheet open={filter != null} onClose={() => setFilter(null)} title="Фильтр">
        {filter === "type" ? (
          <>
            <Pressable style={styles.opt} onPress={() => { setType("all"); setFilter(null); }}>
              <Text style={styles.optText}>Все типы</Text>
            </Pressable>
            {lists.types.map((t) => (
              <Pressable key={t} style={styles.opt} onPress={() => { setType(t); setFilter(null); }}>
                <Text style={styles.optText}>{typeLabel(t)}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
        {filter === "who" ? (
          <>
            <Pressable style={styles.opt} onPress={() => { setWho("all"); setFilter(null); }}>
              <Text style={styles.optText}>Кто угодно</Text>
            </Pressable>
            {lists.whoBuy.map((p) => (
              <Pressable key={p} style={styles.opt} onPress={() => { setWho(p); setFilter(null); }}>
                <Text style={styles.optText}>{personLabel(p)}</Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 16, paddingTop: 8 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { fontSize: 22, fontWeight: "700", color: colors.fg },
  add: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addText: { color: colors.primaryFg, fontWeight: "600" },
  meta: { textAlign: "center", color: colors.mutedFg, fontSize: 13, marginTop: 4 },
  search: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.fg },
  filters: { flexDirection: "row", gap: 8, marginTop: 8 },
  filter: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  filterText: { color: colors.fg, fontSize: 14 },
  row: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: "600", color: colors.fg },
  sub: { fontSize: 12, color: colors.mutedFg, marginTop: 2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  amt: { fontSize: 14, fontWeight: "700", color: colors.fg, fontVariant: ["tabular-nums"] },
  opt: {
    minHeight: 48,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optText: { fontSize: 16, color: colors.fg },
});
