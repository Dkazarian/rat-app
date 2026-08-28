import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Header } from "./header";

const meta = {
  title: "Components/Header",
  component: Header,
  args: {
    appName: "RatApp",
    languageControl: {
      label: "Language",
      locale: "en",
      englishLabel: "English",
      spanishLabel: "Español",
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};
export const SpanishSelected: Story = {
  args: { languageControl: { ...meta.args.languageControl, locale: "es" } },
};
