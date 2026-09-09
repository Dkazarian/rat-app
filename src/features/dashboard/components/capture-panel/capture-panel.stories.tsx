import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLocale } from "@/i18n/locale-context";
import { CapturePanel } from "./capture-panel";
import type { RatDialogueFeedback } from "./rat-dialogue";

type StoryProps = Readonly<{
  feedback: RatDialogueFeedback;
  inputValue?: string;
  disabled?: boolean;
}>;

function LocalizedCapturePanel({ feedback, inputValue, disabled }: StoryProps) {
  const { t } = useLocale();
  return (
    <CapturePanel
      feedback={feedback}
      inputValue={
        inputValue ?? (feedback.state === "empty" ? "" : t("sampleInput"))
      }
      disabled={disabled}
    />
  );
}

const meta = {
  title: "Components/CapturePanel",
  component: LocalizedCapturePanel,
  args: { feedback: { state: "success", extractedCount: 3 } },
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

export const AwaitingInput: Story = { args: { feedback: { state: "empty" } } };
export const Success: Story = {};
export const Loading: Story = {
  args: { feedback: { state: "loading" }, disabled: true },
};
export const ExtractionFailure: Story = {
  args: {
    feedback: {
      state: "extraction-failure",
      detailKey: "apiErrorNoExpensesExtracted",
    },
  },
};
export const InvalidRequest: Story = {
  args: {
    feedback: {
      state: "extraction-failure",
      detailKey: "apiErrorInvalidRequest",
    },
  },
};
export const ServiceUnavailable: Story = {
  args: {
    feedback: {
      state: "provider-error",
      detailKey: "apiErrorServiceUnavailable",
    },
  },
};
export const SessionExpired: Story = {
  args: {
    feedback: { state: "provider-error", detailKey: "apiErrorSessionNotFound" },
  },
};
export const ExpenseLimit: Story = {
  args: {
    feedback: {
      state: "provider-error",
      detailKey: "apiErrorExpenseLimitReached",
    },
  },
};
export const InternalError: Story = {
  args: {
    feedback: { state: "provider-error", detailKey: "apiErrorInternal" },
  },
};
export const UnknownError: Story = {
  args: {
    feedback: { state: "provider-error", detailKey: "apiErrorUnknown" },
  },
};
export const RateLimited: Story = {
  args: { feedback: { state: "rate-limited" } },
};
export const SpanishSessionExpired: Story = {
  args: {
    feedback: { state: "provider-error", detailKey: "apiErrorSessionNotFound" },
  },
  globals: { locale: "es" },
};
