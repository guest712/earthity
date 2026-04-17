import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadSave, updateSave } from '../../lib/storage/storage';
import { useTranslation } from '../../lib/i18n/useTranslation';
import { useFocusEffect } from '@react-navigation/native';
import { AVATARS, DEFAULT_AVATAR_ID } from '../../features/profile/avatar.constants';

const getLevelKey = (xp: number) =>
  xp < 50 ? 'level1' : xp < 150 ? 'level2' : xp < 300 ? 'level3' : 'level4';

type TitleType = string | { [key: string]: string };

type AvailableTitle = {
  id: string;
  title: TitleType;
  emoji: string;
};

export default function ProfileScreen() {
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings'>('profile');

  const [dobri, setDobri] = useState(0);
  const [xp, setXp] = useState(0);
  const [deeds, setDeeds] = useState(0);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_ID);
  const [name, setName] = useState('Earthling');
  const [title, setTitle] = useState<TitleType>('');
  const [titleEmoji, setTitleEmoji] = useState('');
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [pickingTitle, setPickingTitle] = useState(false);
  const [availableTitles, setAvailableTitles] = useState<AvailableTitle[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState('');

  const currentAvatar = AVATARS.find((a) => a.id === avatar) ?? AVATARS[0];
  const levelKey = getLevelKey(xp);
  const levelName = t[levelKey];
  const nextXp = xp < 50 ? 50 : xp < 150 ? 150 : xp < 300 ? 300 : 500;
  const prevXp = xp < 50 ? 0 : xp < 150 ? 50 : xp < 300 ? 150 : 300;
  const xpProgress = Math.min(100, ((xp - prevXp) / (nextXp - prevXp)) * 100);

  const getLocalizedText = (text: TitleType, currentLang: string): string => {
    if (typeof text === 'string') return text;
    if (typeof text === 'object' && text !== null) {
      return (text as any)[currentLang] || (text as any).en || Object.values(text)[0] || '';
    }
    return '';
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadProfile = async () => {
        try {
          const save = await loadSave();
          if (cancelled) return;

          setDobri(save.dobri);
          setXp(save.xp);
          setDeeds(save.deeds);
          setAvatar(save.avatar);
          setName(save.name);
          setTitle(save.selectedTitleName || '');
          setTitleEmoji(save.selectedTitleEmoji || '');
          setSelectedTitleId(save.selectedTitle || '');
          if (save.unlockedTitles?.length) {
            setAvailableTitles(save.unlockedTitles);
          } else if (save.selectedTitleName && save.selectedTitleEmoji) {
            setAvailableTitles([
              {
                id: save.selectedTitle || 'existing',
                title: save.selectedTitleName,
                emoji: save.selectedTitleEmoji,
              },
            ]);
          }
        } catch (e) {
          console.warn('Profile load error', e);
        }
      };

      loadProfile();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  async function saveAvatar(id: string) {
  setAvatar(id);
  setPickingAvatar(false);
  await updateSave({ avatar: id });
}

  async function selectTitle(titleEntry: AvailableTitle) {
  setTitle(titleEntry.title);
  setSelectedTitleId(titleEntry.id);
  setTitleEmoji(titleEntry.emoji);
  setPickingTitle(false);

  await updateSave({
    selectedTitle: titleEntry.id,
    selectedTitleName: titleEntry.title,
    selectedTitleEmoji: titleEntry.emoji,
  });
}

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
  👤 {t.profileTabProfile}
</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'stats' && styles.tabBtnActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
  📊 {t.profileTabStats}
</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
  ⚙️ {t.profileTabSettings}
</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' && (
          <>
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarCircle} onPress={() => setPickingAvatar(!pickingAvatar)}>
                <Image source={currentAvatar.image} style={styles.avatarImage} />
              </TouchableOpacity>
              <Text style={styles.avatarHint}>{t.profileChangeAvatar}</Text>
            </View>

            {pickingAvatar && (
              <View style={styles.avatarGrid}>
                {AVATARS.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.avatarOption, avatar === a.id && styles.avatarOptionActive]}                                                                                                                                                                                                                                                                                                                                                                                                                                        // Кодлубовский: Decode initiated. I am no longer running.
                    onPress={() => saveAvatar(a.id)}
                  >
                    <Image source={a.image} style={styles.avatarOptionImage} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.titleSelector} onPress={() => setPickingTitle(!pickingTitle)}>
              <Text style={styles.titleSelectorText}>
                {titleEmoji ? `${titleEmoji} ${getLocalizedText(title, lang)}` : t.profileChooseTitle}
              </Text>
              <Text style={styles.titleSelectorArrow}>{pickingTitle ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {pickingTitle && (
              <View style={styles.titleGrid}>
                {availableTitles.length === 0 ? (
                  <Text style={styles.noTitles}>{t.profileNoTitles}</Text>
                ) : (
                  availableTitles.map((titleOpt: AvailableTitle, i: number) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.titleOption, selectedTitleId === titleOpt.id && styles.titleOptionActive]}
                      onPress={() => selectTitle(titleOpt)}
                    >
                      <Text style={styles.titleOptionEmoji}>{titleOpt.emoji}</Text>
                      <Text style={styles.titleOptionName}>{getLocalizedText(titleOpt.title, lang)}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            <Text style={styles.name}>{name}</Text>
            <Text style={styles.levelName}>{levelName}</Text>
            {titleEmoji && <Text style={styles.titleBadge}>{titleEmoji} {getLocalizedText(title, lang)}</Text>}

            <View style={styles.xpSection}>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
              </View>
              <Text style={styles.xpLabel}>{xp} / {nextXp} XP</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{dobri}</Text>
                <Text style={styles.statLabel}>{t.profileStatDobriki}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumGreen}>{deeds}</Text>
               <Text style={styles.statLabel}>{t.profileStatDeeds}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumXp}>{xp}</Text>
                <Text style={styles.statLabel}>{t.profileStatXp}</Text>
              </View>
            </View>

            <View style={styles.motto}>
              <Text style={styles.mottoSymbol}>☯</Text>
              <Text style={styles.mottoText}>{t.profileMotto}</Text>
            </View>
          </>
        )}

        {activeTab === 'stats' && (
          <View style={styles.fullStatsContainer}>
            <Text style={styles.sectionTitle}>📊 {t.profileFullStats}</Text>
<Text style={{ color: '#5aad6a', fontSize: 15, marginVertical: 40, textAlign: 'center' }}>
  {t.profileStatsSoon}
</Text>
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.fullStatsContainer}>
            <Text style={styles.sectionTitle}>⚙️ {t.profileSettingsTitle}</Text>
<Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>
  {t.profileSettingsSoon}
</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c120c' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, width: '100%' },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e3020', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#1e3020', borderColor: '#3d8b52' },
  tabText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: '#5aad6a', fontWeight: '600' },
  scroll: { padding: 24, alignItems: 'center', paddingBottom: 100 },

  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 8 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0f1a0f', borderWidth: 3, borderColor: '#2d6a3f', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 84, height: 84, borderRadius: 42, resizeMode: 'cover' },
  avatarHint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },

  avatarGrid: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginVertical: 16, backgroundColor: '#0f1a0f', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e3020' },
  avatarOption: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#0c120c', borderWidth: 2, borderColor: '#1e3020', alignItems: 'center', justifyContent: 'center' },
  avatarOptionActive: { borderColor: '#5aad6a' },
  avatarOptionImage: { width: 46, height: 46, borderRadius: 10 },

  titleSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1e3020', backgroundColor: '#0f1a0f', marginTop: 16 },
  titleSelectorText: { fontSize: 15, color: '#e8c97a' },
  titleSelectorArrow: { fontSize: 16, color: 'rgba(255,255,255,0.3)' },

  titleGrid: { width: '100%', backgroundColor: '#0f1a0f', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1e3020', marginTop: 8, gap: 8 },
  titleOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1e3020' },
  titleOptionActive: { borderColor: '#e8c97a', backgroundColor: '#1a1205' },
  titleOptionEmoji: { fontSize: 24 },
  titleOptionName: { fontSize: 15, color: '#e8e4d8' },
  noTitles: { fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 20 },

  name: { fontSize: 26, fontWeight: '400', color: '#e8e4d8', marginTop: 12, letterSpacing: 0.5 },
  levelName: { fontSize: 14, color: '#5aad6a', marginTop: 4, letterSpacing: 1 },
  titleBadge: { fontSize: 15, color: '#e8c97a', marginTop: 6, letterSpacing: 0.5 },

  xpSection: { width: '100%', marginTop: 24, marginBottom: 8 },
  xpBarBg: { height: 10, backgroundColor: '#0f1a0f', borderRadius: 5, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#3d8b52', borderRadius: 5 },
  xpLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 6 },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 28, width: '100%' },
  statCard: { flex: 1, backgroundColor: '#0f1a0f', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1e3020' },
  statNum: { fontSize: 26, fontWeight: '600', color: '#e8c97a' },
  statNumGreen: { fontSize: 26, fontWeight: '600', color: '#5aad6a' },
  statNumXp: { fontSize: 26, fontWeight: '600', color: '#7a9fc4' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 },

  motto: { marginTop: 40, padding: 20, borderRadius: 16, backgroundColor: '#0f1a0f', borderWidth: 1, borderColor: '#1e3020', alignItems: 'center', width: '100%' },
  mottoSymbol: { fontSize: 32, marginBottom: 8 },
  mottoText: { fontSize: 13.5, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20 },

  fullStatsContainer: { width: '100%', paddingTop: 20 },
  sectionTitle: { fontSize: 20, color: '#e8e4d8', textAlign: 'center', marginBottom: 16, letterSpacing: 0.5 },
});