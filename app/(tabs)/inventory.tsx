import { formatTemplate } from '../../lib/i18n/formatTemplate';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { MAX_WATER } from '../../features/resources/resource.constants';
import { useInventory } from '../../features/inventory/inventory.context';
import { ITEM_CATEGORY, INVENTORY_CATEGORIES } from '../../features/inventory/inventory.constants';
import type { InventoryCategory, InventoryItemId } from '../../features/inventory/inventory.types';
import { DROP_INFO } from '../../lib/shared/game-engine';
import type { DropId } from '../../lib/shared/types';
import { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TOTAL_SLOTS = 12;

const DROP_IDS: DropId[] = ['feather', 'wool', 'pollen', 'scale', 'petal', 'seed'];

type InventorySlotItem = {
  id: InventoryItemId;
  label: string;
  image?: any;
  emoji?: string;
  quantity: number;
  isWateringCan?: boolean;
};

export default function InventoryScreen() {
  const { t, lang } = useTranslation();
  const { resources, drops } = useInventory();
  const [category, setCategory] = useState<InventoryCategory>('resources');

  const categoryLabel: Record<InventoryCategory, string> = {
    resources: t.invCatResources,
    food: t.invCatFood,
    quest_items: t.invCatQuestItems,
  };

  const allItems = useMemo<InventorySlotItem[]>(() => {
    const items: InventorySlotItem[] = [
      {
        id: 'watering_can',
        label: t.itemWateringCan,
        image: require('../../assets/images/items/watercan.png'),
        quantity: 1,
        isWateringCan: true,
      },
      {
        id: 'plastic',
        label: t.itemPlastic,
        image: require('../../assets/images/items/plastictrash.png'),
        quantity: resources.trash.plastic,
      },
      {
        id: 'glass',
        label: t.itemGlass,
        image: require('../../assets/images/items/glasstrash.png'),
        quantity: resources.trash.glass,
      },
      {
        id: 'paper',
        label: t.itemPaper,
        image: require('../../assets/images/items/papertrash.png'),
        quantity: resources.trash.paper,
      },
      {
        id: 'bio',
        label: t.itemBio,
        image: require('../../assets/images/items/bio.png'),
        quantity: resources.trash.bio,
      },
      {
        id: 'feed',
        label: t.itemFeed,
        image: require('../../assets/images/items/feed.png'),
        quantity: resources.feed,
      },
    ];

    for (const dropId of DROP_IDS) {
      const info = DROP_INFO[dropId];
      items.push({
        id: dropId,
        label: info.label[lang] ?? info.label['en'],
        emoji: info.emoji,
        quantity: drops[dropId] ?? 0,
      });
    }

    return items;
  }, [t, resources, drops, lang]);

  const visibleItems = useMemo(() => {
    return allItems.filter((item) => {
      if (ITEM_CATEGORY[item.id] !== category) return false;
      if (item.isWateringCan) return true;
      return item.quantity > 0;
    });
  }, [allItems, category]);

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => visibleItems[i] || null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.inventoryTitle}</Text>
      </View>

      <View style={styles.tabs}>
        {INVENTORY_CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {categoryLabel[cat]}
              </Text>
            </TouchableOpacity>
          );
        })}
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
                {item.image ? (
                  <Image source={item.image} style={{ width: 70, height: 70 }} resizeMode="contain" />
                ) : (
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                )}
                <Text style={styles.itemName}>{item.label}</Text>

                {item.isWateringCan ? (
                  <Text style={{ fontSize: 11, color: '#7ab8f5' }}>
                    {formatTemplate(t.creatureWaterLabel, {
                      current: resources.water,
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
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '400', color: '#e8e4d8', letterSpacing: 0.5 },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1e3020',
    backgroundColor: '#0f1a0f',
  },
  tabActive: {
    borderColor: '#e8c97a',
    backgroundColor: '#2a2415',
  },
  tabText: { fontSize: 12, color: 'rgba(232,228,216,0.65)' },
  tabTextActive: { color: '#e8c97a', fontWeight: '600' },
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
  itemEmoji: { fontSize: 40 },
  itemName: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    textAlign: 'center',
  },
  itemQty: { fontSize: 11, color: '#e8c97a', fontWeight: '600' },
});
