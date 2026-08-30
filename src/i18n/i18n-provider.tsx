"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { createI18n, fallbackLocale } from ".";
import type { Locale } from ".";

type I18nProviderProps = Readonly<{
  children: ReactNode;
  initialLocale?: Locale;
}>;

export function I18nProvider({
  children,
  initialLocale = fallbackLocale,
}: I18nProviderProps) {
  const [i18n] = useState(() => createI18n(initialLocale));

  useEffect(() => {
    const updateDocumentLanguage = (language: string) => {
      document.documentElement.lang = language;
    };

    updateDocumentLanguage(i18n.resolvedLanguage ?? fallbackLocale);
    i18n.on("languageChanged", updateDocumentLanguage);

    return () => {
      i18n.off("languageChanged", updateDocumentLanguage);
    };
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
