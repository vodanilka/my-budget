import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, EmptyState, ErrorBanner, FieldLabel, ScreenSkeleton, Sheet } from "../components/ui";
import { INSTITUTIONS, SANDBOX_LOGIN, mockTransactionsFor } from "../lib/banks";
import { formatMoney, uid } from "../lib/format";
import { cardLabel } from "../lib/labels";
import { useBudget } from "../lib/store";
import type { BankAccount, BankInstitution, Expense } from "../lib/types";
import { colors, radius } from "../theme";

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
    setTimeout(() => {
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
    }, 500);
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
      amount: t.amount,
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

  const sheetTitle =
    step === "login"
      ? inst?.name ?? "Вход"
      : step === "accounts"
        ? "Какие счета связать"
        : step === "import"
          ? "Операции из банка"
          : "Банк";

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.h1}>Банки</Text>
      <Text style={styles.lead}>
        Подключите счета из листа Lists (Card) и Danil Credit Card. Сейчас работает песочница — как
        Plaid Link, без API-ключей.
      </Text>
      {imported ? (
        <Text style={styles.ok}>Импортировали {imported} операций в Expenses.</Text>
      ) : null}

      <Text style={styles.h2}>Подключено</Text>
      {accounts.length === 0 ? (
        <EmptyState
          title="Нет связанных счетов"
          text="Выберите банк ниже. Можно отметить несколько счетов за один раз — личный BoFa, бизнес, карты и наличные."
        />
      ) : (
        accounts.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {a.institutionName} · {a.name}
              </Text>
              <Text style={styles.sub}>
                ••{a.mask} {a.card ? `· ${cardLabel(a.card)}` : ""}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.amt}>{formatMoney(a.balance)}</Text>
              <Pressable onPress={() => disconnectAccount(a.id)}>
                <Text style={styles.danger}>Отвязать</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Text style={[styles.h2, { marginTop: 20 }]}>Карты из таблицы</Text>
      {creditCards.map((c) => (
        <View key={c.id} style={styles.card}>
          <View>
            <Text style={styles.title}>{c.name}</Text>
            <Text style={styles.sub}>
              лимит {formatMoney(c.creditLine)}
              {c.minPay ? ` · мин. ${formatMoney(c.minPay)}` : ""}
            </Text>
          </View>
          <Text style={styles.amt}>{formatMoney(c.balance)}</Text>
        </View>
      ))}

      <Text style={[styles.h2, { marginTop: 20 }]}>Добавить банк</Text>
      <View style={styles.search}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск: Bank of America, Ollo, Kikoff…"
          placeholderTextColor={colors.mutedFg}
          value={q}
          onChangeText={setQ}
        />
      </View>
      {filtered.length === 0 ? (
        <EmptyState title="Банк не найден" text="В песочнице только учреждения из вашей таблицы." />
      ) : (
        filtered.map((i) => {
          const linked = accounts.some((a) => a.institutionId === i.id);
          return (
            <Pressable key={i.id} style={styles.bank} onPress={() => start(i)}>
              <View style={[styles.logo, { backgroundColor: i.color }]}>
                <Ionicons name="business-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{i.name}</Text>
                <Text style={styles.sub}>
                  {i.cards.length ? i.cards.map(cardLabel).join(" · ") : i.shortName}
                </Text>
              </View>
              <Badge label={linked ? "есть" : "Подключить"} tone={linked ? "muted" : "primary"} />
            </Pressable>
          );
        })
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={sheetTitle}
        description="Песочница Plaid-like. Ключи не нужны — данные не уходят в настоящий банк."
      >
        {step === "login" && inst ? (
          <View style={{ gap: 12 }}>
            {loginError ? <ErrorBanner message={loginError} /> : null}
            <Text style={styles.sandbox}>
              Логин песочницы: {SANDBOX_LOGIN.user} / {SANDBOX_LOGIN.password}
            </Text>
            <View>
              <FieldLabel>Логин</FieldLabel>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={user}
                onChangeText={setUser}
              />
            </View>
            <View>
              <FieldLabel>Пароль</FieldLabel>
              <TextInput
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <Button
              label={busy ? "Проверяем…" : "Продолжить"}
              disabled={busy}
              onPress={login}
            />
          </View>
        ) : null}

        {step === "accounts" && inst ? (
          <View style={{ gap: 10 }}>
            {inst.accounts.map((a) => {
              const checked = selected.includes(a.mask);
              return (
                <Pressable
                  key={a.mask}
                  style={styles.check}
                  onPress={() =>
                    setSelected((s) =>
                      checked ? s.filter((x) => x !== a.mask) : [...s, a.mask]
                    )
                  }
                >
                  <View style={[styles.box, checked && styles.boxOn]}>
                    {checked ? <Text style={styles.tick}>✓</Text> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{a.name}</Text>
                    <Text style={styles.sub}>
                      ••{a.mask} · {formatMoney(a.balance)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Button
              label={`Связать ${selected.length} сч.`}
              disabled={selected.length === 0}
              onPress={confirmAccounts}
            />
          </View>
        ) : null}

        {step === "import" ? (
          <View style={{ gap: 10 }}>
            {pending.length === 0 ? (
              <EmptyState
                title="Новых операций нет"
                text="Счёт связан. Когда появятся транзакции, они попадут в Expenses."
              />
            ) : (
              pending.map((t, i) => (
                <View key={`${t.date}-${i}`} style={styles.card}>
                  <View>
                    <Text style={styles.title}>{t.description}</Text>
                    <Text style={styles.sub}>
                      {t.date} · {t.category}
                    </Text>
                  </View>
                  <Text style={styles.amt}>{formatMoney(t.amount)}</Text>
                </View>
              ))
            )}
            <Button
              label={pending.length ? `Добавить ${pending.length} в бюджет` : "Готово"}
              onPress={doImport}
            />
          </View>
        ) : null}
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  h1: { fontSize: 22, fontWeight: "700", color: colors.fg },
  lead: { marginTop: 6, fontSize: 14, color: colors.mutedFg, lineHeight: 20 },
  ok: {
    marginTop: 12,
    backgroundColor: "#E7F3EE",
    color: colors.primary,
    padding: 10,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  h2: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: "700", color: colors.fg },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  title: { fontSize: 14, fontWeight: "600", color: colors.fg },
  sub: { fontSize: 12, color: colors.mutedFg, marginTop: 2 },
  amt: { fontSize: 14, fontVariant: ["tabular-nums"], color: colors.fg },
  danger: { color: colors.danger, fontSize: 13, marginTop: 4 },
  search: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    justifyContent: "center",
    marginBottom: 10,
  },
  searchInput: { fontSize: 16, color: colors.fg },
  bank: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  logo: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sandbox: {
    backgroundColor: colors.muted,
    padding: 10,
    borderRadius: 12,
    fontSize: 12,
    color: colors.mutedFg,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.fg,
  },
  check: {
    minHeight: 56,
    borderRadius: radius.lg,
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
  tick: { color: colors.primaryFg, fontWeight: "700" },
});
