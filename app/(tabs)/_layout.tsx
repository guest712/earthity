import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LANGS } from '../../lib/i18n/i18n';
import { LanguageProvider, useAppLanguage } from '../../lib/i18n/LanguageContext';
import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

function TabsContent() {
  const colorScheme = useColorScheme();
  const { lang } = useAppLanguage();

  const safeLang = lang ?? 'en';
  const t = LANGS[safeLang];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabProfile,
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t.tabAwards,
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏆</Text>,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t.tabInventory,
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🎒</Text>,
        }}
      />
      <Tabs.Screen
  name="diary"
  options={{
    title: t.tabDiary,
    tabBarIcon: ({ focused }) => (
  <Text
    style={{
      fontSize: 22,
      opacity: focused ? 1 : 0.5,
    }}
  >
    📖
  </Text>
),
  }}
/>
      
      <Tabs.Screen
        name="stats"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{ href: null }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <LanguageProvider>
      <TabsContent />
    </LanguageProvider>
  );
}