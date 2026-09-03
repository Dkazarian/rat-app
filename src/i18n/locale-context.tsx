"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getLocale } from ".";
import type { Locale } from ".";

const LocaleContext = createContext<Locale | null>(null);

export function LocaleProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);

  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  const locale = useContext(LocaleContext);

  if (locale === null) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return locale;
}
