import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionsScreen } from "../../src/screens/transactions";
import { colors } from "../../src/theme";

export default function TransactionsRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <TransactionsScreen />
    </SafeAreaView>
  );
}
