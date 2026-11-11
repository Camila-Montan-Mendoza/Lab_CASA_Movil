import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { CasaColors } from "@/design-system/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthNavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, cargando } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    const enLogin = segments[0] === "login";
    if (!user && !enLogin) {
      router.replace("/login");
    } else if (user && enLogin) {
      router.replace("/");
    }
  }, [user, cargando, segments, router]);

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: CasaColors.background,
        }}
      >
        <ActivityIndicator size="large" color={CasaColors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthNavigationGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="index" />
            <Stack.Screen name="punto/[puntoId]" />
          </Stack>
        </AuthNavigationGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
