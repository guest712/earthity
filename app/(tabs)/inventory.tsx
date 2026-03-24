import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function InventoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Инвентарь</Text>
        <Text style={styles.subtitle}>Пока пусто...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  header: { alignItems: 'center', marginTop: 40 },
  title: { fontSize: 24, fontWeight: '400', color: '#e8e4d8', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
});