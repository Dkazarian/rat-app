"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { messages } from "./messages";
import type { Locale, MessageKey } from "./messages";

type LanguageContextValue = Readonly<{
  locale: Locale;
  setLanguage: (locale: Locale) => void;
  toggleLanguage: () => void;
  t: (key: MessageKey) => string;
}>;

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = Readonly<{
  children: ReactNode;
  initialLocale?: Locale;
}>;

export function LanguageProvider({
  children,
  initialLocale = "en",
}: LanguageProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLanguage = (nextLocale: Locale) => {
    setLocale(nextLocale);
  };

  const toggleLanguage = () => {
    setLocale((currentLocale) => (currentLocale === "en" ? "es" : "en"));
  };

  const t = (key: MessageKey) => messages[locale][key];

  return (
    <LanguageContext value={{ locale, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context === null) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
