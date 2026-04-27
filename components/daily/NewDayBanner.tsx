import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 4500;

export default function NewDayBanner({ visible, title, body, onDismiss }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <View
      style={[styles.wrap, { paddingTop: Math.max(12, insets.top + 6) }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onDismiss}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <Text style={styles.hint}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a2818',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8c97a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  cardPressed: { opacity: 0.92 },
  title: {
    color: '#e8c97a',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    color: 'rgba(232,228,216,0.85)',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  hint: {
    position: 'absolute',
    right: 12,
    top: 10,
    color: 'rgba(232,228,216,0.45)',
    fontSize: 14,
  },
});
