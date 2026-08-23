import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LanguageProvider } from "@/localization/language-provider";

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
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
