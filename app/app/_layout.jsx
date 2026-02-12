import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/auth";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeScreen>
        <Slot />
      </SafeScreen>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}