import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import type { Href } from 'expo-router';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

if (__DEV__) {
  LogBox.ignoreLogs([
    /Unable to activate keep awake/i,
    /EXGL: gl\.pixelStorei\(\)/i,
  ]);

  const errorUtils = (global as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (e: Error, fatal?: boolean) => void;
      setGlobalHandler: (h: (e: Error, fatal?: boolean) => void) => void;
    };
  }).ErrorUtils;
  if (errorUtils) {
    const prevHandler = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      if (error?.message?.includes('Unable to activate keep awake')) return;
      prevHandler(error, isFatal);
    });
  }
}

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(app)/(tabs)',
};

function RootStackNav() {
  const { accessToken, isHydrating } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (isHydrating || !navState?.key) return;
    const root = String(segments[0] ?? '');
    const inAuth = root === '(auth)';
    if (!accessToken && !inAuth) {
      router.replace('/login' as Href);
    } else if (accessToken && inAuth) {
      router.replace('/' as Href);
    }
  }, [accessToken, segments, isHydrating, navState?.key, router]);

  useEffect(() => {
    if (!isHydrating) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isHydrating]);

  return (
    <Stack initialRouteName="(auth)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <AuthProvider>
          <RootStackNav />
        </AuthProvider>
      </LanguageProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
