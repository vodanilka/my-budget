import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card, EmptyState, ScreenSkeleton } from "../components/ui";
import { MonthPicker } from "../components/month-picker";
import { useBudget } from "../lib/store";
import { useMonth } from "../lib/month-context";
import {
  analyticsFor,
  budgetTotals,
  expensesInMonth,
  monthReport,
  upcomingBills,
} from "../lib/formulas";
import { categoryLabel, personLabel } from "../lib/labels";
import { formatMoney, formatSigned, round2 } from "../lib/format";
import { colors, radius } from "../theme";

export function DashboardScreen() {
  const router = useRouter();
  const { ready, expenses, salary, sentToVlad, monthlyBudget, bills, creditCards, accounts, workbook } =
    useBudget();
  const { month } = useMonth();

  const stats = useMemo(() => {
    const monthExpenses = expensesInMonth(expenses, month);
    const spent = round2(monthExpenses.reduce((a, e) => a + (e.amount || 0), 0));
    const plan = budgetTotals(monthlyBudget);
    const report = monthReport(month, expenses, salary, sentToVlad);
    const danil = analyticsFor(monthExpenses, month, "Danil");
    const vlad = analyticsFor(monthExpenses, month, "Vlad");
    const biz = analyticsFor(monthExpenses, month, "Business");
    const cats = Object.entries(danil.byCategory)
      .sort((a, b) => b[1] - a[1])
      .filter(([, v]) => Math.abs(v) >= 0.5);
    const remaining = round2(plan.total - spent);
    return { monthExpenses, spent, plan, report, danil, vlad, biz, cats, remaining };
  }, [expenses, salary, sentToVlad, monthlyBudget, month]);

  const billsSorted = useMemo(() => upcomingBills(bills), [bills]);
  const currentDebt = useMemo(() => {
    const months = [...new Set(expenses.map((e) => e.date?.slice(0, 7)).filter(Boolean))];
    const salaryMonths = salary.map((s) => s.date?.slice(0, 7)).filter(Boolean) as string[];
    const all = [...new Set([...months, ...salaryMonths])] as string[];
    return round2(
      all.reduce((acc, ym) => acc + monthReport(ym, expenses, salary, sentToVlad).debt, 0)
    );
  }, [expenses, salary, sentToVlad]);

  if (!ready) return <ScreenSkeleton />;

  const maxCat = stats.cats[0]?.[1] || 1;
  const planPct = Math.min(100, Math.round((stats.spent / (stats.plan.total || 1)) * 100));

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{workbook.replace(".xlsm", "")}</Text>
        <MonthPicker light />
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Потрачено за месяц</Text>
          <Text style={styles.heroValue}>{formatMoney(stats.spent)}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${planPct}%` }]} />
          </View>
          <View style={styles.heroMeta}>
            <Text style={styles.heroSub}>План MyBudget {formatMoney(stats.plan.total)}</Text>
            <Text style={styles.heroSub}>
              {stats.remaining >= 0 ? "остаток" : "сверх плана"}{" "}
              {formatMoney(Math.abs(stats.remaining))}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Card>
          <Text style={styles.cardTitle}>Зарплата · Reports</Text>
          <Row label="Данил" value={formatMoney(stats.report.danilSalary)} up />
          <Row label="Влад" value={formatMoney(stats.report.vladSalary)} up />
          <Row label="Передано Владу" value={formatMoney(stats.report.sentVlad)} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Баланс с Владом</Text>
          <Text style={styles.big}>{formatSigned(stats.report.debt)}</Text>
          <Text style={styles.hint}>
            За месяц: зарплата Влада − передано + (его траты на вас − ваши на него).
            {stats.report.debt >= 0 ? " Плюс — к выплате Владу." : " Минус — Влад должен вам."}
          </Text>
          <Text style={styles.bodyText}>
            Накоплено Current:{" "}
            <Text style={styles.strong}>{formatSigned(currentDebt)}</Text>
          </Text>
          <View style={styles.split}>
            <View style={styles.chip}>
              <Text style={styles.hint}>Danil for Vlad</Text>
              <Text style={styles.strong}>{formatMoney(stats.report.danilForVlad)}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.hint}>Vlad for Danil</Text>
              <Text style={styles.strong}>{formatMoney(stats.report.vladForDanil)}</Text>
            </View>
          </View>
        </Card>

        <View>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>Категории Данила</Text>
            <Text style={styles.hint}>Analitics · доля Both ½</Text>
          </View>
          {stats.cats.length === 0 ? (
            <EmptyState
              title="В этом месяце пусто"
              text="Нет личных трат Данила. Добавьте операцию или отсканируйте чек."
              action={
                <Pressable style={styles.scanBtn} onPress={() => router.push("/scan")}>
                  <Ionicons name="scan-outline" size={18} color={colors.primaryFg} />
                  <Text style={styles.scanBtnText}>Сканировать чек</Text>
                </Pressable>
              }
            />
          ) : (
            <Card>
              {stats.cats.slice(0, 8).map(([name, value]) => (
                <View key={name} style={{ marginBottom: 10 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.bodyText}>{categoryLabel(name)}</Text>
                    <Text style={styles.mono}>{formatMoney(value)}</Text>
                  </View>
                  <View style={styles.catTrack}>
                    <View
                      style={[
                        styles.catFill,
                        { width: `${Math.min(100, (value / maxCat) * 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
              <View style={[styles.rowBetween, styles.totalRow]}>
                <Text style={styles.bodyText}>Итого Данил</Text>
                <Text style={styles.strong}>{formatMoney(stats.danil.total)}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.hint}>Влад / бизнес</Text>
                <Text style={styles.hint}>
                  {formatMoney(stats.vlad.total)} · {formatMoney(stats.biz.total)}
                </Text>
              </View>
            </Card>
          )}
        </View>

        <View>
          <Text style={styles.h2}>План MyBudget</Text>
          <Card>
            {monthlyBudget.map((line) => (
              <View key={line.name} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bodyText}>{line.name}</Text>
                  <Text style={styles.hint}>
                    {typeof line.day === "number" ? `${line.day}-е число` : "без даты"}
                    {line.note ? ` · ${line.note}` : ""}
                  </Text>
                </View>
                <Text style={styles.mono}>{formatMoney(line.amount)}</Text>
              </View>
            ))}
            <View style={styles.line}>
              <Text style={styles.strong}>Living with Vlad</Text>
              <Text style={styles.strong}>{formatMoney(stats.plan.livingWithVlad)}</Text>
            </View>
          </Card>
        </View>

        <View>
          <Text style={styles.h2}>Счета и карты</Text>
          <Card>
            {billsSorted.slice(0, 6).map((b) => (
              <View key={b.name} style={styles.line}>
                <View>
                  <Text style={styles.bodyText}>{b.name}</Text>
                  <Text style={styles.hint}>{b.day}-е каждый месяц</Text>
                </View>
                <Text style={styles.mono}>{formatMoney(b.amount)}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12 }}>
              {creditCards.map((c) => {
                const used = c.creditLine ? c.balance / c.creditLine : 0;
                return (
                  <View key={c.id} style={{ marginBottom: 10 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.bodyText}>{c.name}</Text>
                      <Text style={styles.mono}>{formatMoney(c.balance)}</Text>
                    </View>
                    <View style={styles.catTrack}>
                      <View
                        style={[
                          styles.catFill,
                          { width: `${Math.min(100, used * 100)}%`, backgroundColor: colors.amber },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.hint}>
                {accounts.length ? `${accounts.length} счёт. подключено` : "Банки не подключены"}
              </Text>
              <Pressable onPress={() => router.push("/banks")}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Подключить</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {stats.monthExpenses.length > 0 ? (
          <View>
            <View style={styles.sectionHead}>
              <Text style={styles.h2}>Последние операции</Text>
              <Pressable onPress={() => router.push("/transactions")}>
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Все</Text>
              </Pressable>
            </View>
            {stats.monthExpenses
              .slice()
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
              .slice(0, 6)
              .map((e) => (
                <View key={e.id} style={styles.tx}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bodyText} numberOfLines={1}>
                      {e.description || categoryLabel(e.category)}
                    </Text>
                    <Text style={styles.hint}>
                      {categoryLabel(e.category)} · {personLabel(String(e.whoBuy))}
                    </Text>
                  </View>
                  <Text style={styles.mono}>{formatMoney(e.amount)}</Text>
                </View>
              ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.hint}>{label}</Text>
      <Text style={[styles.mono, up && { color: colors.emerald }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8 },
  kicker: {
    color: "rgba(248,246,240,0.7)",
    letterSpacing: 1.4,
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  hero: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: 16,
  },
  heroLabel: { color: "rgba(248,246,240,0.85)", fontSize: 14 },
  heroValue: { color: colors.primaryFg, fontSize: 34, fontWeight: "700", marginTop: 4 },
  track: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, marginTop: 12, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.primaryFg, borderRadius: 99 },
  heroMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  heroSub: { color: "rgba(248,246,240,0.8)", fontSize: 12 },
  body: { padding: 16, gap: 16 },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10, color: colors.fg },
  h2: { fontSize: 16, fontWeight: "700", color: colors.fg, marginBottom: 8 },
  hint: { fontSize: 12, color: colors.mutedFg, lineHeight: 18 },
  bodyText: { fontSize: 14, color: colors.fg },
  strong: { fontWeight: "700", color: colors.fg, fontVariant: ["tabular-nums"] },
  big: { fontSize: 26, fontWeight: "700", color: colors.fg, fontVariant: ["tabular-nums"] },
  mono: { fontSize: 14, fontVariant: ["tabular-nums"], color: colors.fg },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  split: { flexDirection: "row", gap: 8, marginTop: 12 },
  chip: { flex: 1, backgroundColor: colors.muted, borderRadius: 14, padding: 10 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 },
  catTrack: { height: 8, backgroundColor: colors.muted, borderRadius: 99, overflow: "hidden", marginTop: 4 },
  catFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 99 },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 8 },
  tx: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scanBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanBtnText: { color: colors.primaryFg, fontWeight: "600" },
});
