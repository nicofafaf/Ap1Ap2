import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import de from "../../data/locales/de.json";
import en from "../../data/locales/en.json";
import {
  createTranslator,
  persistLocale,
  readStoredLocale,
  type NexusLocale,
} from "./translationEngine";
import type { NestedMessages } from "./translationEngine";

const catalogs: Record<NexusLocale, NestedMessages> = {
  de: de as NestedMessages,
  en: en as NestedMessages,
};

export type NexusI18nContextValue = {
  locale: NexusLocale;
  setLocale: (next: NexusLocale) => void;
  t: (key: string, fallback?: string) => string;
  messages: NestedMessages;
};

const NexusI18nContext = createContext<NexusI18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<NexusLocale>(() => {
    if (typeof localStorage === "undefined") return "de";
    return readStoredLocale();
  });

  const messages = catalogs[locale];
  const t = useMemo(() => createTranslator(messages), [messages]);

  const setLocale = useCallback((next: NexusLocale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, setLocale, t, messages]
  );

  return <NexusI18nContext.Provider value={value}>{children}</NexusI18nContext.Provider>;
}

export function useNexusI18n(): NexusI18nContextValue {
  const ctx = useContext(NexusI18nContext);
  if (!ctx) {
    throw new Error("useNexusI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useOptionalNexusI18n(): NexusI18nContextValue | null {
  return useContext(NexusI18nContext);
}
