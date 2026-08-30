"use client";

import type { Locale } from "@/i18n";
import type { LanguageControlProps } from "@/types/presentation";

const options = [
  { locale: "en", shortLabel: "EN", labelKey: "englishLabel" },
  { locale: "es", shortLabel: "ES", labelKey: "spanishLabel" },
] as const satisfies ReadonlyArray<{
  locale: Locale;
  shortLabel: string;
  labelKey: "englishLabel" | "spanishLabel";
}>;

export function LanguageControl({
  label,
  locale,
  englishLabel,
  spanishLabel,
  onLocaleChange,
}: LanguageControlProps) {
  const labels = { englishLabel, spanishLabel };

  return (
    <div
      role="group"
      aria-label={label}
      className="grid shrink-0 grid-cols-2 rounded-full border border-[#49404f] bg-[#302a37] p-[3px]"
    >
      {options.map((option) => (
        <button
          key={option.locale}
          type="button"
          aria-label={labels[option.labelKey]}
          aria-pressed={locale === option.locale}
          onClick={() => onLocaleChange?.(option.locale)}
          className="min-w-[42px] cursor-pointer rounded-full border-0 bg-transparent px-[10px] py-[7px] text-[#bbb1c1] outline-offset-2 transition-colors aria-pressed:bg-[#efe7f2] aria-pressed:text-[#26222d] focus-visible:outline-2 focus-visible:outline-[#86afe0] motion-reduce:transition-none"
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}
