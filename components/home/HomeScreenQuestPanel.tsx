import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { DROP_INFO } from '../../lib/shared/game-engine';
import type { LocaleStrings } from '../../lib/i18n/locale-strings';
import type { DropId, LanguageCode, Quest } from '../../lib/shared/types';
import CategoryTabs from './CategoryTabs';
import { homeScreenStyles as styles } from './homeScreen.styles';

export type HomeScreenQuestPanelProps = {
  category: 'all' | 'outdoor' | 'home';
  onCategoryChange: (c: 'all' | 'outdoor' | 'home') => void;
  categoryLabels: { all: string; outdoor: string; home: string };
  t: LocaleStrings;
  lang: LanguageCode;
  filteredQuests: Quest[];
  lockedQuests: Quest[];
  drops: Partial<Record<DropId, number>>;
  onQuestCardPress: (q: Quest) => void;
  onClearCompletedQuests: () => void;
};

export default function HomeScreenQuestPanel(props: HomeScreenQuestPanelProps) {
  const {
    category,
    onCategoryChange,
    categoryLabels,
    t,
    lang,
    filteredQuests,
    lockedQuests,
    drops,
    onQuestCardPress,
    onClearCompletedQuests,
  } = props;

  return (
    <>
      <CategoryTabs category={category} onChange={onCategoryChange} labels={categoryLabels} />
      <ScrollView style={styles.list}>
        <Text style={styles.sectionTitle}>
          {filteredQuests.length > 0 ? `${filteredQuests.length} ${t.nearby}` : t.clean}
        </Text>
        {filteredQuests.map((q) => (
          <TouchableOpacity key={q.id} style={styles.card} onPress={() => onQuestCardPress(q)}>
            <Text style={styles.cardEmoji}>{q.emoji}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{q.title[lang]}</Text>
              <Text style={styles.cardDesc}>{q.desc[lang]}</Text>
            </View>
            <Text style={styles.cardReward}>+{q.reward}🪙</Text>
          </TouchableOpacity>
        ))}
        {filteredQuests.length === 0 && lockedQuests.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 16 }}>
            <Text style={styles.empty}>{t.empty}</Text>
            <TouchableOpacity
              style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e3020' }}
              onPress={onClearCompletedQuests}
            >
              <Text style={styles.newQuestsText}>{t.newQuests}</Text>
            </TouchableOpacity>
          </View>
        )}
        {lockedQuests.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12, color: 'rgba(255,255,255,0.25)' }]}>
              🔒 {lockedQuests.length}
            </Text>
            {lockedQuests.map((q) => {
              const cond = q.unlockedBy!;
              const have = drops[cond.dropId] ?? 0;
              const info = DROP_INFO[cond.dropId];
              return (
                <View key={q.id} style={styles.cardLocked}>
                  <Text style={styles.cardEmoji}>{q.emoji}</Text>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitleLocked}>{q.title[lang]}</Text>
                    <Text style={styles.cardDesc}>
                      {t.questLockedNeed}: {have}/{cond.amount} {info.emoji}
                    </Text>
                  </View>
                  <Text style={styles.cardRewardLocked}>+{q.reward}🪙</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </>
  );
}
