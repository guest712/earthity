import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATARS = ['🌱', '🌿', '🌳', '🦊', '🐺', '🦅', '🐬', '🦋', '🐢', '🌍', '☯', '⭐'];

const LEVEL_NAMES: Record<string, string> = {
  level1: '🌱 Росток',
  level2: '🌿 Эко',
  level3: '🌳 Хранитель',
  level4: '⭐ Герой',
};

const getLevelKey = (xp: number) =>
  xp < 50 ? 'level1' : xp < 150 ? 'level2' : xp < 300 ? 'level3' : 'level4';

export default function ProfileScreen() {
  const [dobri, setDobri] = useState(0);
  const [xp, setXp] = useState(0);
  const [deeds, setDeeds] = useState(0);
  const [avatar, setAvatar] = useState('🌱');
  const [name, setName] = useState('Earthling');
  const [title, setTitle] = useState('');
  const [titleEmoji, setTitleEmoji] = useState('');
  const [pickingAvatar, setPickingAvatar] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('earthity_save').then(data => {
      if (data) {
        try {
          const save = JSON.parse(data);
          if (save.dobri) setDobri(save.dobri);
          if (save.xp) setXp(save.xp);
          if (save.deeds) setDeeds(save.deeds);
          if (save.avatar) setAvatar(save.avatar);
          if (save.name) setName(save.name);
          if (save.selectedTitleName) setTitle(save.selectedTitleName);
          if (save.selectedTitleEmoji) setTitleEmoji(save.selectedTitleEmoji);
        } catch (e) { }
      }
    });
  }, []);

  function saveAvatar(a: string) {
    setAvatar(a);
    setPickingAvatar(false);
    AsyncStorage.getItem('earthity_save').then(data => {
      const save = data ? JSON.parse(data) : {};
      AsyncStorage.setItem('earthity_save', JSON.stringify({ ...save, avatar: a }));
    });
  }

  const levelKey = getLevelKey(xp);
  const levelName = LEVEL_NAMES[levelKey];
  const nextXp = xp < 50 ? 50 : xp < 150 ? 150 : xp < 300 ? 300 : 500;
  const prevXp = xp < 50 ? 0 : xp < 150 ? 50 : xp < 300 ? 150 : 300;
  const xpProgress = Math.min(100, ((xp - prevXp) / (nextXp - prevXp)) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => setPickingAvatar(!pickingAvatar)}>
            <Text style={styles.avatarEmoji}>{avatar}</Text>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Нажмите чтобы сменить</Text>
        </View>

        {/* Avatar picker */}
        {pickingAvatar && (
          <View style={styles.avatarGrid}>
            {AVATARS.map(a => (
              <TouchableOpacity key={a} style={[styles.avatarOption, avatar === a && styles.avatarOptionActive]} onPress={() => saveAvatar(a)}>
                <Text style={styles.avatarOptionEmoji}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Name */}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.levelName}>{levelName}</Text>
        {title ? (
          <Text style={styles.titleBadge}>{titleEmoji} {title}</Text>
        ) : null}

        {/* XP bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpLabel}>{xp} / {nextXp} XP</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{dobri}</Text>
            <Text style={styles.statLabel}>добриков</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumGreen}>{deeds}</Text>
            <Text style={styles.statLabel}>добрых дел</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumXp}>{xp}</Text>
            <Text style={styles.statLabel}>опыта</Text>
          </View>
        </View>

        {/* Ahimsa motto */}
        <View style={styles.motto}>
          <Text style={styles.mottoSymbol}>☯</Text>
          <Text style={styles.mottoText}>Ахимса — ненасилие{'\n'}по отношению ко всему живому</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  scroll: { padding: 24, alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 8 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#0f1a0f', borderWidth: 2, borderColor: '#2d6a3f',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarEmoji: { fontSize: 52 },
  avatarHint: { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    justifyContent: 'center', marginVertical: 16,
    backgroundColor: '#0f1a0f', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#1e3020',
  },
  avatarOption: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0c120c', borderWidth: 1, borderColor: '#1e3020',
  },
  avatarOptionActive: { borderColor: '#5aad6a', backgroundColor: '#1e3020' },
  avatarOptionEmoji: { fontSize: 28 },
  name: { fontSize: 24, fontWeight: '400', color: '#e8e4d8', marginTop: 8, letterSpacing: 0.5 },
  levelName: { fontSize: 13, color: '#5aad6a', marginTop: 4, letterSpacing: 1 },
  xpSection: { width: '100%', marginTop: 20, marginBottom: 8 },
  xpBarBg: { height: 8, backgroundColor: '#0f1a0f', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  xpBarFill: { height: '100%', backgroundColor: '#3d8b52', borderRadius: 4 },
  xpLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
  statCard: {
    flex: 1, backgroundColor: '#0f1a0f', borderRadius: 12,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#1e3020',
  },
  statNum: { fontSize: 24, fontWeight: '600', color: '#e8c97a' },
  statNumGreen: { fontSize: 24, fontWeight: '600', color: '#5aad6a' },
  statNumXp: { fontSize: 24, fontWeight: '600', color: '#7a9fc4' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: 0.5 },
  motto: {
    marginTop: 32, padding: 20, borderRadius: 16,
    backgroundColor: '#0f1a0f', borderWidth: 1, borderColor: '#1e3020',
    alignItems: 'center', width: '100%',
  },
  mottoSymbol: { fontSize: 28, marginBottom: 10 },
  mottoText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20, letterSpacing: 0.5 },
  titleBadge: { fontSize: 13, color: '#e8c97a', marginTop: 4, letterSpacing: 0.5 },
});