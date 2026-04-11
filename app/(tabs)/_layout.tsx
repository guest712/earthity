import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadSave } from '../../lib/storage';
import { LANGS } from '../../lib/i18n';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [lang, setLang] = useState<'ru' | 'de' | 'uk' | 'ar' | 'en'>('en');

  useEffect(() => {
    const loadLang = async () => {
      try {
        const save = await loadSave();
        setLang(save.lang || 'en');
      } catch (e) {
        console.warn('Tab layout load error', e);
      }
    };

    loadLang();
  }, []);

  const t = LANGS[lang];

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
        name="stats"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}