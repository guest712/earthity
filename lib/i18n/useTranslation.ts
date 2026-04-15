import type { LanguageCode } from '../shared/types';
import { LANGS } from './i18n';
import type { LocaleStrings } from './locale-strings';
import { useAppLanguage } from './LanguageContext';

export function useTranslation(): { t: LocaleStrings; lang: LanguageCode } {
  const { lang } = useAppLanguage();
  const code: LanguageCode = lang ?? 'en';
  const t = LANGS[code];
  return { t, lang: code };
}

/** When `LanguageContext.lang` is still null (e.g. language gate). */
export function getStrings(lang: LanguageCode | null | undefined): LocaleStrings {
  const code: LanguageCode = lang && LANGS[lang] ? lang : 'en';
  return LANGS[code];
}
