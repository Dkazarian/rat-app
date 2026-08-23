import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MascotCard } from "./mascot-card";

const meta = {
  title: "Foundation/MascotCard",
  component: MascotCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <main className="grid min-h-screen place-items-center bg-amber-50 p-6">
        <Story />
      </main>
    ),
  ],
  args: {
    eyebrow: "Foundation ready",
    title: "Ratapp is ready for its interface.",
    description:
      "This prop-driven story verifies shared Tailwind styles and the public mascot asset.",
  },
} satisfies Meta<typeof MascotCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SpanishCopy: Story = {
  args: {
    eyebrow: "Base lista",
    title: "Ratapp está listo para su interfaz.",
    description:
      "Esta variante demuestra que el componente acepta contenido mediante propiedades tipadas.",
  },
};
