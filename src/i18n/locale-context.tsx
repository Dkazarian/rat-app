"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { getLocale } from ".";
import type { Locale } from ".";

type LocaleContextValue = Readonly<{
  locale: Locale;
  t: TFunction;
  changeLocale: (locale: Locale) => Promise<void>;
}>;

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { i18n, t } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage ?? i18n.language);
  const changeLocale = useCallback(
    async (nextLocale: Locale) => {
      await i18n.changeLanguage(nextLocale);
    },
    [i18n],
  );
  const value = useMemo(
    () => ({ locale, t, changeLocale }),
    [locale, t, changeLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (context === null) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
