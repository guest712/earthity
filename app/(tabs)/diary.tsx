import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { loadSave } from '../../lib/storage/storage';
import type { CareDiaryEntry, LanguageCode } from '../../lib/shared/types';
import { CREATURES } from '../../features/creatures/creature.constants';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { formatTemplate } from '../../lib/i18n/formatTemplate';

function dateLocaleTag(lang: LanguageCode): string {
  switch (lang) {
    case 'ar':
      return 'ar-SA';
    case 'uk':
      return 'uk-UA';
    case 'de':
      return 'de-DE';
    case 'ru':
      return 'ru-RU';
    default:
      return 'en-US';
  }
}

export default function DiaryScreen() {
  const { t, lang } = useTranslation();
  const [diary, setDiary] = useState<CareDiaryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const save = await loadSave();
      setDiary(save.careDiary || []);
    };

    load();
  }, []);

  const getCreature = (id: string) => CREATURES.find((c) => c.id === id);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, marginBottom: 12 }}>{t.diaryCareTitle}</Text>

      <FlatList
        data={diary}
        keyExtractor={(item) => item.creatureId}
        extraData={lang}
        renderItem={({ item }) => {
          const creature = getCreature(item.creatureId);
          const name = creature?.label?.[lang] || creature?.label?.en || item.creatureId;
          const localeTag = dateLocaleTag(lang);

          return (
            <View
              style={{
                padding: 12,
                marginBottom: 10,
                borderRadius: 10,
                backgroundColor: '#1e3020',
              }}
            >
              <Text style={{ fontSize: 16, color: 'white' }}>{name}</Text>

              <Text style={{ color: '#8aab8a' }}>
                {t.diaryFirstSeen}{' '}
                {new Date(item.firstSeenAt).toLocaleDateString(localeTag)}
              </Text>

              <Text style={{ color: '#8aab8a' }}>
                {formatTemplate(t.diaryCareCount, { count: item.interactions })}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}
