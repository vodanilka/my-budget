import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { availableMonths } from "../lib/formulas";
import { monthTitle } from "../lib/labels";
import { useBudget } from "../lib/store";
import { useMonth } from "../lib/month-context";
import { colors } from "../theme";

export function MonthPicker({ light = false }: { light?: boolean }) {
  const { expenses, salary } = useBudget();
  const { month, setMonth } = useMonth();
  const months = availableMonths(expenses, salary);
  const idx = Math.max(0, months.indexOf(month));
  const prev = months[idx - 1];
  const next = months[idx + 1];
  const tint = light ? colors.primaryFg : colors.fg;

  return (
    <View style={styles.row}>
      <Pressable
        disabled={!prev}
        onPress={() => prev && setMonth(prev)}
        style={[styles.arrow, !prev && { opacity: 0.3 }]}
        accessibilityLabel="Предыдущий месяц"
      >
        <Ionicons name="chevron-back" size={22} color={tint} />
      </Pressable>
      <Text style={[styles.title, { color: tint }]}>{monthTitle(month)}</Text>
      <Pressable
        disabled={!next}
        onPress={() => next && setMonth(next)}
        style={[styles.arrow, !next && { opacity: 0.3 }]}
        accessibilityLabel="Следующий месяц"
      >
        <Ionicons name="chevron-forward" size={22} color={tint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  arrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700" },
});
