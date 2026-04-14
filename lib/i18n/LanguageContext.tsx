import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadSave, updateSave } from '../storage/storage';

export type LanguageCode = 'ru' | 'de' | 'uk' | 'ar' | 'en';

type LanguageContextValue = {
  lang: LanguageCode | null;
  setAppLanguage: (nextLang: LanguageCode) => Promise<void>;
  openLanguagePicker: () => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LanguageCode | null>(null);

  useEffect(() => {
    const loadLang = async () => {
      try {
        const save = await loadSave();
        setLang(save.lang || 'en');
      } catch (e) {
        console.warn('Language load error', e);
        setLang('en');
      }
    };

    loadLang();
  }, []);

  const setAppLanguage = async (nextLang: LanguageCode) => {
    setLang(nextLang);
    try {
      await updateSave({ lang: nextLang });
    } catch (e) {
      console.warn('Language save error', e);
    }
  };

  const openLanguagePicker = () => {
    setLang(null);
  };

  return (
    <LanguageContext.Provider value={{ lang, setAppLanguage, openLanguagePicker }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useAppLanguage() {
  const ctx = useContext(LanguageContext);

  if (!ctx) {
    throw new Error('useAppLanguage must be used inside LanguageProvider');
  }

  return ctx;
}