"use client";

import Image from "next/image";
import type { RatDialogueState } from "./rat-dialogue";
import type { TranslationKey } from "@/i18n";
import { useLocale } from "@/i18n/locale-context";

export type MascotProps = Readonly<{
  state: RatDialogueState;
  priority?: boolean;
}>;

const mascotByState = {
  empty: ["/assets/rat-mascot-awaiting.png", "emptyMascotAlt"],
  loading: ["/assets/rat-mascot-sniffing.png", "loadingMascotAlt"],
  success: ["/assets/rat-mascot.png", "successMascotAlt"],
  "extraction-failure": [
    "/assets/rat-mascot-confused.png",
    "extractionFailureMascotAlt",
  ],
  "provider-error": ["/assets/rat-mascot-error.png", "providerErrorMascotAlt"],
  "rate-limited": ["/assets/rat-mascot-tired.png", "rateLimitedMascotAlt"],
} as const satisfies Record<
  RatDialogueState,
  readonly [string, TranslationKey]
>;

export function Mascot({ state, priority = false }: MascotProps) {
  const { t } = useLocale();
  const [src, altKey] = mascotByState[state];

  return (
    <Image
      src={src}
      alt={t(altKey)}
      width={116}
      height={116}
      priority={priority}
      className="size-[116px] max-w-none self-end object-contain max-[680px]:size-[88px]"
    />
  );
}
