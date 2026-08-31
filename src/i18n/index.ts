import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import translationEn from "./locales/en/translation.json";
import translationEs from "./locales/es/translation.json";

export const supportedLocales = ["en", "es"] as const;
export const fallbackLocale = "en" as const;

export type Locale = (typeof supportedLocales)[number];

type TranslationDictionary = Readonly<
  Record<keyof typeof translationEn, string>
>;

const synchronizedSpanishTranslation: TranslationDictionary = translationEs;

export const resources = {
  en: { translation: translationEn },
  es: { translation: synchronizedSpanishTranslation },
} as const;

export type TranslationKey =
  keyof (typeof resources)[typeof fallbackLocale]["translation"];

export function createI18n(initialLocale: string = fallbackLocale) {
  const instance = createInstance();

  void instance.use(initReactI18next).init({
    resources,
    supportedLngs: supportedLocales,
    fallbackLng: fallbackLocale,
    lng: initialLocale,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    initAsync: false,
  });

  return instance;
}

export function getLocale(language: string): Locale {
  return language === "es" ? "es" : fallbackLocale;
}
