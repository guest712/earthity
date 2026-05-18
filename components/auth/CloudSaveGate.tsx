import { useAuth } from '@/lib/auth/AuthContext';
import { reconcileCloudSave } from '@/lib/supabase/cloudSave';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

/**
 * Runs cloud ↔ local reconcile once per login before tabs hydrate inventory/home.
 */
export default function CloudSaveGate({ children }: Props) {
  const { accessToken } = useAuth();
  const [ready, setReady] = useState(!accessToken);

  useEffect(() => {
    if (!accessToken) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    reconcileCloudSave()
      .catch((e) => {
        if (__DEV__) console.warn('[CloudSaveGate] reconcile failed', e);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!ready) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator size="large" color="#5aad6a" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c120c',
  },
});
