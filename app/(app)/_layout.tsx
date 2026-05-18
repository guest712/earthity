import CloudSaveGate from '@/components/auth/CloudSaveGate';
import { Stack } from 'expo-router';

export default function AppGroupLayout() {
  return (
    <CloudSaveGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </CloudSaveGate>
  );
}
