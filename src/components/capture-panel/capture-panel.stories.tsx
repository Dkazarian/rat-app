import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CapturePanel } from "./capture-panel";

const input = {
  label: "What did you spend?",
  placeholder: "Lunch $18, coffee $4.50 and taxi $12",
  actionLabel: "Sort it",
  value: "Lunch $18, coffee $4.50 and taxi $12",
};

const meta = {
  title: "Components/CapturePanel",
  component: CapturePanel,
  args: {
    dialogue: {
      state: "success",
      announcement: "polite",
      mascotSrc: "/assets/rat-mascot.png",
      mascotAlt: "Happy rat mascot",
      title: "Done",
      detail: "3 expenses sorted.",
    },
    input,
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-[#18161e] p-6 text-sm text-[#f7f2fa]">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof CapturePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AwaitingInput: Story = {
  args: {
    dialogue: {
      state: "empty",
      announcement: "polite",
      mascotSrc: "/assets/rat-mascot-awaiting.png",
      mascotAlt: "Rat mascot waiting for expense input",
      title: "Ready",
      detail: "Tell me what you spent.",
    },
    input: { ...input, value: "" },
  },
};
export const Success: Story = {};
export const Loading: Story = {
  args: {
    dialogue: {
      state: "loading",
      announcement: "polite",
      mascotSrc: "/assets/rat-mascot-sniffing.png",
      mascotAlt: "Rat mascot sniffing for categories",
      title: "Sorting…",
      detail: "Looking for the right buckets.",
    },
    input: { ...input, disabled: true },
  },
};
export const Error: Story = {
  args: {
    dialogue: {
      state: "provider-error",
      announcement: "assertive",
      mascotSrc: "/assets/rat-mascot-error.png",
      mascotAlt: "Worried rat mascot",
      title: "Something went wrong",
      detail: "Try again in a moment.",
    },
    input,
  },
};
