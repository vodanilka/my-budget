"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  ScanLine,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InstallBanner } from "@/components/install-banner";
import { MonthPicker } from "@/components/month-picker";
import { EmptyState, ScreenSkeleton } from "@/components/states";
import { useBudget } from "@/lib/store";
import { useMonth } from "@/lib/month-context";
import {
  analyticsFor,
  budgetTotals,
  expensesInMonth,
  monthReport,
  upcomingBills,
} from "@/lib/formulas";
import { categoryLabel, personLabel } from "@/lib/labels";
import { formatMoney, formatSigned, round2 } from "@/lib/format";

export function DashboardScreen() {
  const {
    ready,
    expenses,
    salary,
    sentToVlad,
    monthlyBudget,
    bills,
    creditCards,
    accounts,
    workbook,
  } = useBudget();
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
    const income = round2(report.danilSalary);
    const remaining = round2(plan.total - spent);
    return {
      monthExpenses,
      spent,
      plan,
      report,
      danil,
      vlad,
      biz,
      cats,
      income,
      remaining,
    };
  }, [expenses, salary, sentToVlad, monthlyBudget, month]);

  const billsSorted = useMemo(() => upcomingBills(bills), [bills]);
  const currentDebt = useMemo(() => {
    // Reports!I2 = SUM of monthly H across all months present in data
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
    <div className="pb-8">
      <header
        className="bg-primary px-4 pb-6 text-primary-foreground"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <p className="text-xs tracking-widest text-primary-foreground/70 uppercase">
          {workbook.replace(".xlsm", "")}
        </p>
        <div className="mt-2 text-primary-foreground [&_button]:text-primary-foreground [&_p]:text-primary-foreground">
          <MonthPicker />
        </div>
        <div className="mt-4 rounded-3xl bg-primary-foreground/10 p-4 backdrop-blur">
          <p className="text-sm text-primary-foreground/80">Потрачено за месяц</p>
          <p className="mt-1 font-heading text-4xl font-semibold tracking-tight tabular-nums">
            {formatMoney(stats.spent)}
          </p>
          <div className="mt-3">
            <Progress value={planPct} className="*:data-[slot=progress-track]:bg-primary-foreground/20 *:data-[slot=progress-indicator]:bg-primary-foreground" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-primary-foreground/80">
            <span>План MyBudget {formatMoney(stats.plan.total)}</span>
            <span>
              {stats.remaining >= 0 ? "остаток" : "сверх плана"}{" "}
              {formatMoney(Math.abs(stats.remaining))}
            </span>
          </div>
        </div>
      </header>

      <div className="mt-4">
        <InstallBanner />
      </div>

      <div className="grid gap-3 px-4 md:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="size-4" />
              Зарплата · Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row
              icon={<ArrowUpRight className="size-4 text-emerald-700" />}
              label="Данил"
              value={formatMoney(stats.report.danilSalary)}
            />
            <Row
              icon={<ArrowUpRight className="size-4 text-emerald-700" />}
              label="Влад"
              value={formatMoney(stats.report.vladSalary)}
            />
            <Row
              icon={<ArrowDownRight className="size-4 text-amber-700" />}
              label="Передано Владу"
              value={formatMoney(stats.report.sentVlad)}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">Баланс с Владом</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatSigned(stats.report.debt)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              За месяц: зарплата Влада − передано + (его траты на вас − ваши на него).
              {stats.report.debt >= 0
                ? " Плюс — к выплате Владу."
                : " Минус — Влад должен вам."}
            </p>
            <p className="mt-2 text-sm">
              Накоплено Current:{" "}
              <span className="font-medium tabular-nums">{formatSigned(currentDebt)}</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-muted px-3 py-2">
                <p className="text-muted-foreground">Danil for Vlad</p>
                <p className="font-medium tabular-nums">
                  {formatMoney(stats.report.danilForVlad)}
                </p>
              </div>
              <div className="rounded-xl bg-muted px-3 py-2">
                <p className="text-muted-foreground">Vlad for Danil</p>
                <p className="font-medium tabular-nums">
                  {formatMoney(stats.report.vladForDanil)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-5 px-4">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-base font-semibold">Категории Данила</h2>
          <span className="text-xs text-muted-foreground">
            Analitics · доля Both ½
          </span>
        </div>
        {stats.cats.length === 0 ? (
          <EmptyState
            title="В этом месяце пусто"
            text="Нет личных трат Данила. Добавьте операцию или отсканируйте чек."
            action={
              <Button render={<Link href="/scan" />} size="lg" className="h-11">
                <ScanLine className="size-4" />
                Сканировать чек
              </Button>
            }
          />
        ) : (
          <Card className="rounded-3xl">
            <CardContent className="space-y-3">
              {stats.cats.slice(0, 8).map(([name, value]) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{categoryLabel(name)}</span>
                    <span className="tabular-nums">{formatMoney(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (value / maxCat) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm">
                <span>Итого Данил</span>
                <span className="font-medium tabular-nums">
                  {formatMoney(stats.danil.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Влад / бизнес</span>
                <span className="tabular-nums">
                  {formatMoney(stats.vlad.total)} · {formatMoney(stats.biz.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mt-5 px-4 md:grid md:grid-cols-2 md:gap-3">
        <div>
          <h2 className="mb-2 text-base font-semibold">План MyBudget</h2>
          <Card className="rounded-3xl">
            <CardContent className="divide-y">
              {monthlyBudget.map((line) => (
                <div key={line.name} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeof line.day === "number" ? `${line.day}-е число` : "без даты"}
                      {line.note ? ` · ${line.note}` : ""}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">{formatMoney(line.amount)}</p>
                </div>
              ))}
              <div className="flex justify-between py-2.5 text-sm font-medium">
                <span>Living with Vlad</span>
                <span className="tabular-nums">{formatMoney(stats.plan.livingWithVlad)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 md:mt-0">
          <h2 className="mb-2 text-base font-semibold">Счета и карты</h2>
          <Card className="rounded-3xl">
            <CardContent className="space-y-3">
              {billsSorted.slice(0, 6).map((b) => (
                <div key={b.name} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.day}-е каждый месяц</p>
                  </div>
                  <p className="text-sm tabular-nums">{formatMoney(b.amount)}</p>
                </div>
              ))}
              <div className="border-t pt-3">
                {creditCards.map((c) => {
                  const used = c.creditLine ? c.balance / c.creditLine : 0;
                  return (
                    <div key={c.id} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="size-3.5" />
                          {c.name}
                        </span>
                        <span className="tabular-nums">{formatMoney(c.balance)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-600"
                          style={{ width: `${Math.min(100, used * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <Badge variant="secondary">
                  {accounts.length
                    ? `${accounts.length} счёт. подключено`
                    : "Банки не подключены"}
                </Badge>
                <Button render={<Link href="/banks" />} variant="ghost" size="sm">
                  Подключить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {stats.monthExpenses.length > 0 ? (
        <section className="mt-5 px-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Последние операции</h2>
            <Button render={<Link href="/transactions" />} variant="ghost" size="sm">
              Все
            </Button>
          </div>
          <div className="space-y-2">
            {stats.monthExpenses
              .slice()
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
              .slice(0, 6)
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-2xl bg-card px-3 py-3 ring-1 ring-foreground/8"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {e.description || categoryLabel(e.category)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabel(e.category)} · {personLabel(String(e.whoBuy))}
                    </p>
                  </div>
                  <p className="ml-3 text-sm font-medium tabular-nums">
                    {formatMoney(e.amount)}
                  </p>
                </div>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
