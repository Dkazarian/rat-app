import type { Metadata } from "next";
import type { ReactNode } from "react";

import { I18nProvider } from "@/i18n/i18n-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ratapp",
  description: "A playful expense-classification demo.",
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
