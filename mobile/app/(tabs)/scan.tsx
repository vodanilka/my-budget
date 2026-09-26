import { SafeAreaView } from "react-native-safe-area-context";
import { ScanScreen } from "../../src/screens/scan";

export default function ScanRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }} edges={["top"]}>
      <ScanScreen />
    </SafeAreaView>
  );
}
