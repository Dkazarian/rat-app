import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLocale } from "@/i18n/locale-context";
import { CapturePanel } from "./capture-panel";
import type { RatDialogueFeedback, RatDialogueState } from "./rat-dialogue";

type StoryProps = Readonly<{
  state: RatDialogueState;
  inputValue?: string;
  disabled?: boolean;
}>;

function feedbackFor(state: RatDialogueState): RatDialogueFeedback {
  if (state === "success") return { state, extractedCount: 3 };
  if (state === "extraction-failure") {
    return { state, detailKey: "apiErrorNoExpensesExtracted" };
  }
  if (state === "provider-error") {
    return { state, detailKey: "apiErrorServiceUnavailable" };
  }
  return { state };
}

function LocalizedCapturePanel({ state, inputValue, disabled }: StoryProps) {
  const { t } = useLocale();
  return (
    <CapturePanel
      feedback={feedbackFor(state)}
      inputValue={inputValue ?? (state === "empty" ? "" : t("sampleInput"))}
      disabled={disabled}
    />
  );
}

const meta = {
  title: "Components/CapturePanel",
  component: LocalizedCapturePanel,
  args: { state: "success" as const },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-[#18161e] p-6 text-sm text-[#f7f2fa]">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof LocalizedCapturePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AwaitingInput: Story = { args: { state: "empty" } };
export const Success: Story = {};
export const Loading: Story = { args: { state: "loading", disabled: true } };
export const Error: Story = { args: { state: "provider-error" } };
export const RateLimited: Story = { args: { state: "rate-limited" } };
