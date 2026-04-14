import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { loadSave } from '../../lib/storage/storage';
import type { CareDiaryEntry } from '../../lib/shared/types';
import { CREATURES } from '../../features/creatures/creature.constants';

export default function DiaryScreen() {
  const [diary, setDiary] = useState<CareDiaryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const save = await loadSave();
      setDiary(save.careDiary || []);
    };

    load();
  }, []);

  const getCreature = (id: string) =>
    CREATURES.find((c) => c.id === id);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, marginBottom: 12 }}>
        📖 Дневник заботы
      </Text>

      <FlatList
        data={diary}
        keyExtractor={(item) => item.creatureId}
        renderItem={({ item }) => {
          const creature = getCreature(item.creatureId);

          return (
            <View style={{
              padding: 12,
              marginBottom: 10,
              borderRadius: 10,
              backgroundColor: '#1e3020'
            }}>
              <Text style={{ fontSize: 16, color: 'white' }}>
                {creature?.label?.ru || item.creatureId}
              </Text>

              <Text style={{ color: '#8aab8a' }}>
                Встречено: {new Date(item.firstSeenAt).toLocaleDateString()}
              </Text>

              <Text style={{ color: '#8aab8a' }}>
                Забота: {item.interactions} раз
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}