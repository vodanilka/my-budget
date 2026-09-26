import { SafeAreaView } from "react-native-safe-area-context";
import { DashboardScreen } from "../../src/screens/dashboard";
import { colors } from "../../src/theme";

export default function OverviewRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={["top"]}>
      <DashboardScreen />
    </SafeAreaView>
  );
}
