import type { LanguageCode } from '../shared/types';

const CODES: LanguageCode[] = ['ru', 'de', 'uk', 'ar', 'en'];

/** Best-effort device UI language for first-run hints (no extra native deps). */
export function guessDeviceLanguage(): LanguageCode {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    const base = tag.split(/[-_]/)[0]?.toLowerCase();
    if (base && CODES.includes(base as LanguageCode)) return base as LanguageCode;
  } catch {
    /* ignore */
  }
  return 'en';
}
