import { SafeAreaView } from "react-native-safe-area-context";
import { BanksScreen } from "../../src/screens/banks";
import { colors } from "../../src/theme";

export default function BanksRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <BanksScreen />
    </SafeAreaView>
  );
}
