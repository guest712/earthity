import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'earthity_auth_access_token';

export async function readStoredAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(KEY);
    }
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function writeStoredAccessToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearStoredAccessToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* noop */
  }
}
