import type { Locale } from "@/i18n";

const numberLocales = {
  en: "en-US",
  es: "es-AR",
} as const satisfies Record<Locale, string>;

export function formatAmount(minorUnits: number, locale: Locale): string {
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) {
    throw new RangeError("minorUnits must be a non-negative safe integer");
  }

  const amount = new Intl.NumberFormat(numberLocales[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);

  return `$${amount}`;
}
