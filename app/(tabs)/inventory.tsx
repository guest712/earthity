import { loadSave } from '../../lib/storage';
import { LANGS } from '../../lib/i18n';
import { useEffect, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const ITEMS = [
  {
    id: 'watering_can',
    name: {
      ru: 'Лейка',
      de: 'Gießkanne',
      uk: 'Лійка',
      ar: 'إبريق السقي',
      en: 'Watering Can',
    },
    image: require('../../assets/images/items/watercan.png'),
    quantity: 1,
  },
];

const TOTAL_SLOTS = 12;

export default function InventoryScreen() {
  const [waterLevel, setWaterLevel] = useState(10);
  const [lang, setLang] = useState<'ru' | 'de' | 'uk' | 'ar' | 'en'>('en');

  useEffect(() => {
    const load = async () => {
      try {
        const save = await loadSave();
        setWaterLevel(save.waterLevel);
        setLang(save.lang || 'en');
      } catch (e) {
        console.warn('Inventory load error', e);
      }
    };

    load();
  }, []);

  const t = LANGS[lang];

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    return ITEMS[i] || null;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.inventoryTitle}</Text>
      </View>

      <FlatList
        data={slots}
        numColumns={3}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={[styles.slot, item && styles.slotFilled]}>
            {item ? (
              <>
                <Image source={item.image} style={{ width: 70, height: 70 }} resizeMode="contain" />
                <Text style={styles.itemName}>{item.name[lang] || item.name.en}</Text>

                {item.id === 'watering_can' ? (
                  <Text style={{ fontSize: 11, color: '#7ab8f5' }}>
                    💧 {waterLevel} / 10
                  </Text>
                ) : (
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                )}
              </>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '400', color: '#e8e4d8', letterSpacing: 0.5 },
  grid: { paddingHorizontal: 16 },
  slot: {
    flex: 1,
    margin: 6,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3020',
    backgroundColor: '#0f1a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: {
    borderColor: '#2d6a3f',
  },
  itemName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    textAlign: 'center',
  },
  itemQty: { fontSize: 11, color: '#e8c97a', fontWeight: '600' },
});