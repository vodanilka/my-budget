"use client";

import { useMemo, useState } from "react";
import { Check, Landmark, Lock, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmptyState, ErrorBanner, ScreenSkeleton } from "@/components/states";
import { INSTITUTIONS, SANDBOX_LOGIN, mockTransactionsFor } from "@/lib/banks";
import { formatMoney, uid } from "@/lib/format";
import { cardLabel } from "@/lib/labels";
import { useBudget } from "@/lib/store";
import type { BankAccount, BankInstitution, Expense } from "@/lib/types";

type Step = "pick" | "login" | "accounts" | "import";

export function BanksScreen() {
  const {
    ready,
    accounts,
    connectAccounts,
    disconnectAccount,
    importBankTransactions,
    creditCards,
  } = useBudget();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [inst, setInst] = useState<BankInstitution | null>(null);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState<Omit<Expense, "id">[]>([]);
  const [imported, setImported] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return INSTITUTIONS.filter((i) =>
      `${i.name} ${i.shortName} ${i.cards.join(" ")}`.toLowerCase().includes(needle)
    );
  }, [q]);

  function start(institution: BankInstitution) {
    setInst(institution);
    setStep("login");
    setUser("");
    setPassword("");
    setLoginError(null);
    setImported(null);
    setOpen(true);
  }

  function login() {
    if (!inst) return;
    setBusy(true);
    setLoginError(null);
    window.setTimeout(() => {
      const sandbox =
        !user ||
        (user === SANDBOX_LOGIN.user && password === SANDBOX_LOGIN.password);
      if (!sandbox && password !== "sandbox") {
        setBusy(false);
        setLoginError(
          `Песочница: логин ${SANDBOX_LOGIN.user} / пароль ${SANDBOX_LOGIN.password}. Без ключей Plaid банк не настоящий.`
        );
        return;
      }
      setSelected(inst.accounts.map((a) => a.mask));
      setBusy(false);
      setStep("accounts");
    }, 700);
  }

  function confirmAccounts() {
    if (!inst) return;
    const chosen = inst.accounts.filter((a) => selected.includes(a.mask));
    const rows: Omit<BankAccount, "connectedAt">[] = chosen.map((a) => ({
      id: `${inst.id}-${a.mask}`,
      institutionId: inst.id,
      institutionName: inst.name,
      name: a.name,
      mask: a.mask,
      type: a.type,
      card: a.card,
      balance: a.balance,
    }));
    connectAccounts(rows);
    const txs = mockTransactionsFor(inst.id).map((t) => ({
      date: t.date,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: t.amount < 0 ? t.amount : t.amount,
      whoBuy: "Danil" as const,
      forWho: "Danil" as const,
      free: false,
      card: chosen[0]?.card ?? null,
      source: "bank" as const,
      bankAccountId: rows[0]?.id ?? uid("acc"),
    }));
    setPending(txs.filter((t) => t.amount !== 0));
    setStep("import");
  }

  function doImport() {
    const n = importBankTransactions(pending);
    setImported(n);
    setOpen(false);
    setStep("pick");
  }

  if (!ready) return <ScreenSkeleton />;

  return (
    <div className="px-4 pb-8" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
      <h1 className="text-xl font-semibold tracking-tight">Банки</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Подключите счета из листа Lists (Card) и Danil Credit Card. Сейчас работает песочница — как Plaid Link, без API-ключей.
      </p>

      {imported ? (
        <p className="mt-3 rounded-2xl bg-primary/10 px-3 py-2 text-sm">
          Импортировали {imported} операций в Expenses.
        </p>
      ) : null}

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-medium">Подключено</h2>
        {accounts.length === 0 ? (
          <EmptyState
            title="Нет связанных счетов"
            text="Выберите банк ниже. Можно отметить несколько счетов за один раз — личный BoFa, бизнес, карты и наличные."
          />
        ) : (
          <div className="space-y-2">
            {accounts.map((a) => (
              <Card key={a.id} className="rounded-2xl">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {a.institutionName} · {a.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ••{a.mask} {a.card ? `· ${cardLabel(a.card)}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums">{formatMoney(a.balance)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-destructive"
                      onClick={() => disconnectAccount(a.id)}
                    >
                      <Unplug className="size-3.5" />
                      Отвязать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-medium">Карты из таблицы</h2>
        <div className="mb-3 space-y-2">
          {creditCards.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-2xl bg-card px-3 py-3 ring-1 ring-foreground/8"
            >
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  лимит {formatMoney(c.creditLine)}
                  {c.minPay ? ` · мин. ${formatMoney(c.minPay)}` : ""}
                </p>
              </div>
              <p className="text-sm tabular-nums">{formatMoney(c.balance)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-medium">Добавить банк</h2>
        <Input
          className="mb-3 h-12 rounded-xl text-base"
          placeholder="Поиск: Bank of America, Ollo, Kikoff…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {filtered.length === 0 ? (
          <EmptyState title="Банк не найден" text="В песочнице только учреждения из вашей таблицы." />
        ) : (
          <div className="space-y-2">
            {filtered.map((i) => {
              const linked = accounts.some((a) => a.institutionId === i.id);
              return (
                <button
                  type="button"
                  key={i.id}
                  onClick={() => start(i)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card px-3 py-3 text-left ring-1 ring-foreground/8"
                >
                  <span
                    className="flex size-11 items-center justify-center rounded-2xl text-white"
                    style={{ background: i.color }}
                  >
                    <Landmark className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{i.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {i.cards.length ? i.cards.map(cardLabel).join(" · ") : i.shortName}
                    </span>
                  </span>
                  {linked ? <Badge variant="secondary">есть</Badge> : <Badge>Подключить</Badge>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader>
            <DrawerTitle>
              {step === "login" && (inst?.name ?? "Вход")}
              {step === "accounts" && "Какие счета связать"}
              {step === "import" && "Операции из банка"}
              {step === "pick" && "Банк"}
            </DrawerTitle>
            <DrawerDescription>
              Песочница Plaid-like. Ключи не нужны — данные не уходят в настоящий банк.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">
            {step === "login" && inst ? (
              <div className="space-y-3">
                {loginError ? <ErrorBanner message={loginError} /> : null}
                <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <Lock className="size-3.5" />
                  Логин песочницы: {SANDBOX_LOGIN.user} / {SANDBOX_LOGIN.password}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user">Логин</Label>
                  <Input
                    id="user"
                    className="h-12"
                    autoComplete="username"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pass">Пароль</Label>
                  <Input
                    id="pass"
                    type="password"
                    className="h-12"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  className="h-12 w-full"
                  size="lg"
                  disabled={busy}
                  onClick={login}
                >
                  {busy ? "Проверяем…" : "Продолжить"}
                </Button>
              </div>
            ) : null}

            {step === "accounts" && inst ? (
              <div className="space-y-3">
                {inst.accounts.map((a) => {
                  const checked = selected.includes(a.mask);
                  return (
                    <label
                      key={a.mask}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-border px-3 py-2"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setSelected((s) =>
                            v ? [...s, a.mask] : s.filter((x) => x !== a.mask)
                          )
                        }
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{a.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          ••{a.mask} · {formatMoney(a.balance)}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <Button
                  className="h-12 w-full"
                  size="lg"
                  disabled={selected.length === 0}
                  onClick={confirmAccounts}
                >
                  Связать {selected.length} сч.
                </Button>
              </div>
            ) : null}

            {step === "import" ? (
              <div className="space-y-3">
                {pending.length === 0 ? (
                  <EmptyState
                    title="Новых операций нет"
                    text="Счёт связан. Когда появятся транзакции, они попадут в Expenses."
                  />
                ) : (
                  pending.map((t, i) => (
                    <div
                      key={`${t.date}-${i}`}
                      className="flex items-center justify-between rounded-2xl bg-muted px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.date} · {t.category}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums">{formatMoney(t.amount)}</p>
                    </div>
                  ))
                )}
                <Button className="h-12 w-full" size="lg" onClick={doImport}>
                  <Check className="size-4" />
                  {pending.length ? `Добавить ${pending.length} в бюджет` : "Готово"}
                </Button>
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
