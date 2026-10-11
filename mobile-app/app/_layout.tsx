import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/auth/AuthContext";
import { colors } from "../src/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "600" },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false, title: "Home" }} />
          <Stack.Screen name="product/[id]" options={{ title: "Product" }} />
          <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
          <Stack.Screen name="sign-up" options={{ title: "Create account" }} />
          <Stack.Screen name="dashboard" options={{ title: "Dashboard", headerLeft: () => null }} />
          <Stack.Screen name="apply" options={{ title: "Apply for loan" }} />
          <Stack.Screen name="emi-calculator" options={{ title: "EMI Calculator" }} />
          <Stack.Screen name="profile" options={{ title: "Profile" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
