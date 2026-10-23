import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18n } from "i18n-js";
import { translations } from "./translations";

export type Language = "en" | "id";

const STORAGE_KEY = "@an-nur/language";
const i18n = new I18n(translations);
i18n.enableFallback = true;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "en" || saved === "id") setLanguageState(saved);
    });
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<I18nContextValue>(() => {
    i18n.locale = language;
    return {
      language,
      setLanguage,
      t: (key, options) => i18n.t(key, options),
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

/** For non-React code (store): reads the language currently in use. */
export const translate = (key: string, options?: Record<string, string | number>) => i18n.t(key, options);
