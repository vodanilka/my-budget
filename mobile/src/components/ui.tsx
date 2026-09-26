import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius } from "../theme";

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger" | "secondary";
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "ghost" && styles.btnGhost,
        variant === "danger" && styles.btnDanger,
        variant === "secondary" && styles.btnSecondary,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.btnText,
          variant === "ghost" && { color: colors.primary },
          variant === "danger" && { color: colors.danger },
          variant === "secondary" && { color: colors.fg },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "primary" | "outline";
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === "primary" && { backgroundColor: colors.primary },
        tone === "outline" && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === "primary" && { color: colors.primaryFg },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {action}
    </View>
  );
}

export function ScreenSkeleton() {
  return (
    <View style={styles.skel}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.emptyText}>Загружаем Budget VF…</Text>
    </View>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.err}>
      <Text style={styles.errText}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.retry}>Повторить</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetWrap}>
        <Pressable style={styles.sheetDim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {description ? (
            <Text style={styles.sheetDesc}>{description}</Text>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: "transparent" },
  btnDanger: { backgroundColor: "#FDECEC" },
  btnSecondary: { backgroundColor: colors.muted },
  btnText: { color: colors.primaryFg, fontSize: 16, fontWeight: "600" },
  badge: {
    backgroundColor: colors.muted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: colors.fg, fontWeight: "600" },
  empty: {
    padding: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.fg },
  emptyText: { fontSize: 14, color: colors.mutedFg, lineHeight: 20 },
  skel: { padding: 40, alignItems: "center", gap: 12 },
  err: {
    backgroundColor: "#FDECEC",
    borderRadius: radius.md,
    padding: 12,
    marginVertical: 8,
  },
  errText: { color: colors.danger, fontSize: 14 },
  retry: { marginTop: 6, color: colors.primary, fontWeight: "600" },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheetDim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.fg },
  sheetDesc: { marginTop: 4, marginBottom: 12, fontSize: 13, color: colors.mutedFg },
  label: { fontSize: 13, fontWeight: "600", color: colors.fg, marginBottom: 6 },
});
