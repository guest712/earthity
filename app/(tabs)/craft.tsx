import { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '../../lib/i18n/useTranslation';
import { formatTemplate } from '../../lib/i18n/formatTemplate';
import { useInventory } from '../../features/inventory/inventory.context';
import { useDailyQuests } from '../../features/dailyQuests/dailyQuests.context';
import { CRAFT_RECIPES } from '../../features/crafting/craft.constants';
import {
  applyCraftCost,
  checkCraftAffordable,
} from '../../lib/shared/craft-engine';
import type { CraftRecipe } from '../../features/crafting/craft.types';
import type { TrashId } from '../../lib/shared/types';

export default function CraftScreen() {
  const { t, lang } = useTranslation();
  const { resources, crafted, addCrafted, setTrash } = useInventory();
  const { increment: incrementDaily } = useDailyQuests();

  const trashLabel = useMemo<Record<TrashId, string>>(
    () => ({
      plastic: t.craftMissingPlastic,
      glass: t.craftMissingGlass,
      paper: t.craftMissingPaper,
      bio: t.craftMissingBio,
    }),
    [t]
  );

  const handleCraft = (recipe: CraftRecipe) => {
    const check = checkCraftAffordable(recipe, resources.trash);
    if (!check.ok) {
      Alert.alert(t.craftNotEnough);
      return;
    }
    setTrash(applyCraftCost(recipe, resources.trash));
    addCrafted(recipe.id, recipe.yield ?? 1);
    incrementDaily('do_crafts', 1);
    Alert.alert(
      formatTemplate(t.craftSuccess, {
        name: recipe.label[lang] ?? recipe.label.en,
      })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.craftTitle}</Text>
        <Text style={styles.subtitle}>{t.craftSubtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {CRAFT_RECIPES.map((recipe) => {
          const owned = crafted[recipe.id] ?? 0;
          const check = checkCraftAffordable(recipe, resources.trash);
          const affordable = check.ok;

          return (
            <View
              key={recipe.id}
              style={[styles.card, affordable ? styles.cardOk : styles.cardLocked]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{recipe.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>
                    {recipe.label[lang] ?? recipe.label.en}{' '}
                    {owned > 0 ? <Text style={styles.owned}>×{owned}</Text> : null}
                  </Text>
                  <Text style={styles.cardDesc}>
                    {recipe.description[lang] ?? recipe.description.en}
                  </Text>
                </View>
              </View>

              <Text style={styles.costHeader}>{t.craftCostHeader}</Text>
              <View style={styles.costRow}>
                {recipe.cost.map((c) => {
                  const have = resources.trash[c.type];
                  const enough = have >= c.amount;
                  return (
                    <Text
                      key={c.type}
                      style={[
                        styles.costChip,
                        enough ? styles.costChipOk : styles.costChipBad,
                      ]}
                    >
                      {trashLabel[c.type]} {have}/{c.amount}
                    </Text>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.button, !affordable && styles.buttonDisabled]}
                onPress={() => handleCraft(recipe)}
                disabled={!affordable}
              >
                <Text
                  style={[
                    styles.buttonText,
                    !affordable && styles.buttonTextDisabled,
                  ]}
                >
                  {t.craftButton}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 22, color: '#e8e4d8', letterSpacing: 0.5 },
  subtitle: {
    fontSize: 13,
    color: 'rgba(232,228,216,0.55)',
    marginTop: 4,
  },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardOk: {
    backgroundColor: '#0f1a0f',
    borderColor: '#2d6a3f',
  },
  cardLocked: {
    backgroundColor: '#0f1a0f',
    borderColor: '#1e3020',
    opacity: 0.85,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    color: '#e8e4d8',
    fontWeight: '600',
  },
  owned: { color: '#e8c97a', fontWeight: '600' },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(232,228,216,0.6)',
    marginTop: 2,
  },
  costHeader: {
    fontSize: 11,
    color: 'rgba(232,228,216,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  costRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  costChip: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  costChipOk: {
    color: '#9be0a8',
    borderColor: '#2d6a3f',
    backgroundColor: 'rgba(45,106,63,0.18)',
  },
  costChipBad: {
    color: '#d49797',
    borderColor: '#5a2a2a',
    backgroundColor: 'rgba(90,42,42,0.2)',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#2d6a3f',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1e3020',
  },
  buttonText: { color: '#e8e4d8', fontWeight: '600' },
  buttonTextDisabled: { color: 'rgba(232,228,216,0.4)' },
});
