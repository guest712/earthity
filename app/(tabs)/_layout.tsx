import { HapticTab } from '@/components/haptic-tab';
import { useKeepAwake } from 'expo-keep-awake';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '../../lib/i18n/LanguageContext';
import { InventoryProvider } from '../../features/inventory/inventory.context';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { Tabs, Stack } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

function TabsContent() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

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
      <Tabs.Screen
        name="three-test"
        options={{ href: null }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <LanguageProvider>
      <InventoryProvider>
        <TabsContent />
      </InventoryProvider>
    </LanguageProvider>
  );
}