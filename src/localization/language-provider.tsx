"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import { messages } from "./messages";
import type { Locale, MessageKey } from "./messages";

type LanguageContextValue = Readonly<{
  locale: Locale;
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

  const toggleLanguage = () => {
    setLocale((currentLocale) => (currentLocale === "en" ? "es" : "en"));
  };

  const t = (key: MessageKey) => messages[locale][key];

  return (
    <LanguageContext value={{ locale, toggleLanguage, t }}>
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
