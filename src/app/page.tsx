"use client";

import { MascotCard } from "@/components/mascot-card/mascot-card";
import { useLanguage } from "@/localization/language-provider";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <MascotCard
        eyebrow={t("scaffoldEyebrow")}
        title={t("scaffoldTitle")}
        description={t("scaffoldDescription")}
      />
    </main>
  );
}
