import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BudgetProvider } from "../src/lib/store";
import { MonthProvider } from "../src/lib/month-context";

export default function RootLayout() {
  return (
    <BudgetProvider>
      <MonthProvider>
        <StatusBar style="light" />
        <Slot />
      </MonthProvider>
    </BudgetProvider>
  );
}
