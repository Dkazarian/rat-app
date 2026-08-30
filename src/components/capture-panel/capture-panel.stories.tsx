import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslation } from "react-i18next";

import { CapturePanel } from "./capture-panel";
import type { RatDialogueState } from "./rat-dialogue";

type StoryProps = Readonly<{
  state: RatDialogueState;
  inputValue?: string;
  disabled?: boolean;
}>;

const mascotByState: Record<RatDialogueState, string> = {
  empty: "/assets/rat-mascot-awaiting.png",
  loading: "/assets/rat-mascot-sniffing.png",
  success: "/assets/rat-mascot.png",
  "extraction-failure": "/assets/rat-mascot-confused.png",
  "provider-error": "/assets/rat-mascot-error.png",
};

function LocalizedCapturePanel({ state, inputValue, disabled }: StoryProps) {
  const { t } = useTranslation();
  const titleKey = {
    empty: "emptyTitle",
    loading: "loadingTitle",
    success: "successTitle",
    "extraction-failure": "extractionFailureTitle",
    "provider-error": "providerErrorTitle",
  } as const;
  const detailKey = {
    empty: "emptyDetail",
    loading: "loadingDetail",
    success: "successDetail",
    "extraction-failure": "extractionFailureDetail",
    "provider-error": "providerErrorDetail",
  } as const;
  const altKey = {
    empty: "emptyMascotAlt",
    loading: "loadingMascotAlt",
    success: "successMascotAlt",
    "extraction-failure": "extractionFailureMascotAlt",
    "provider-error": "providerErrorMascotAlt",
  } as const;

  return (
    <CapturePanel
      dialogue={{
        state,
        announcement:
          state === "extraction-failure" || state === "provider-error"
            ? "assertive"
            : "polite",
        mascotSrc: mascotByState[state],
        mascotAlt: t(altKey[state]),
        title: t(titleKey[state]),
        detail: t(detailKey[state]),
      }}
      input={{
        label: t("inputLabel"),
        placeholder: t("inputPlaceholder"),
        actionLabel: t("sortAction"),
        value: inputValue ?? (state === "empty" ? "" : t("sampleInput")),
        disabled,
      }}
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
