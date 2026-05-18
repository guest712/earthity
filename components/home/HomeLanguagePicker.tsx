import { LANGS, FLAG } from '../../lib/i18n/i18n';
import { guessDeviceLanguage } from '../../lib/i18n/guess-locale';
import type { LanguageCode } from '../../lib/shared/types';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeScreenStyles as styles } from './homeScreen.styles';

type Props = {
  onSelectLanguage: (code: LanguageCode) => void;
};

export default function HomeLanguagePicker({ onSelectLanguage }: Props) {
  const pick = LANGS[guessDeviceLanguage()];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.langScreen}>
        <Text style={styles.langSymbol}>🌍</Text>
        <Text style={styles.langTitle}>Earthity</Text>
        <Text style={styles.langSub}>{pick.langPickerSubtitle}</Text>
        <View style={styles.langGrid}>
          {(Object.keys(LANGS) as LanguageCode[]).map((l) => (
            <TouchableOpacity key={l} style={styles.langBtn} onPress={() => onSelectLanguage(l)}>
              <Text style={styles.langFlag}>{FLAG[l]}</Text>
              <Text style={styles.langName}>{l.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
