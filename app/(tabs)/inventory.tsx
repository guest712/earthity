import { getResources } from '../../lib/storage/save.repository';
import { formatTemplate } from '../../lib/i18n/formatTemplate';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { MAX_WATER } from '../../features/resources/resource.constants';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const TOTAL_SLOTS = 12;

export default function InventoryScreen() {
  const { t, lang } = useTranslation();
  const [waterLevel, setWaterLevel] = useState(10);
  const [feedCount, setFeedCount] = useState(0);
  const [plastic, setPlastic] = useState(0);
  const [glass, setGlass] = useState(0);
  const [paper, setPaper] = useState(0);
  const [bio, setBio] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        try {
          const res = await getResources();
          if (cancelled) return;
          setWaterLevel(res.water);
          setFeedCount(res.feed);
          setPlastic(res.trash.plastic);
          setGlass(res.trash.glass);
          setPaper(res.trash.paper);
          setBio(res.trash.bio);
        } catch (e) {
          console.warn('Inventory load error', e);
        }
      };

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const ITEMS = useMemo(
    () =>
      [
        {
          id: 'watering_can',
          label: t.itemWateringCan,
          image: require('../../assets/images/items/watercan.png'),
          quantity: 1,
        },
        {
          id: 'plastic',
          label: t.itemPlastic,
          image: require('../../assets/images/items/plastictrash.png'),
          quantity: plastic,
        },
        {
          id: 'glass',
          label: t.itemGlass,
          image: require('../../assets/images/items/glasstrash.png'),
          quantity: glass,
        },
        {
          id: 'paper',
          label: t.itemPaper,
          image: require('../../assets/images/items/papertrash.png'),
          quantity: paper,
        },
        {
          id: 'bio',
          label: t.itemBio,
          image: require('../../assets/images/items/bio.png'),
          quantity: bio,
        },
        {
          id: 'feed',
          label: t.itemFeed,
          image: require('../../assets/images/items/feed.png'),
          quantity: feedCount,
        },
      ].filter((item) => item.id !== 'feed' || feedCount > 0),
    [t, plastic, glass, paper, bio, feedCount]
  );

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
        extraData={lang}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={[styles.slot, item && styles.slotFilled]}>
            {item ? (
              <>
                <Image source={item.image} style={{ width: 70, height: 70 }} resizeMode="contain" />
                <Text style={styles.itemName}>{item.label}</Text>

                {item.id === 'watering_can' ? (
                  <Text style={{ fontSize: 11, color: '#7ab8f5' }}>
                    {formatTemplate(t.creatureWaterLabel, {
                      current: waterLevel,
                      max: MAX_WATER,
                    })}
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
