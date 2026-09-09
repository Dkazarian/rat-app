import type { Ref } from "react";
import { ExpenseInput } from "./expense-input";
import { Mascot } from "./mascot";
import { RatDialogue } from "./rat-dialogue";
import type { RatDialogueFeedback } from "./rat-dialogue";

export type CapturePanelProps = Readonly<{
  feedback: RatDialogueFeedback;
  inputValue: string;
  inputRef?: Ref<HTMLTextAreaElement>;
  validationCode?: "empty" | "too-long";
  disabled?: boolean;
  onInputChange?: (value: string) => void;
  onSubmit?: () => void;
}>;

export function CapturePanel({
  feedback,
  inputValue,
  inputRef,
  validationCode,
  disabled,
  onInputChange,
  onSubmit,
}: CapturePanelProps) {
  return (
    <section className="grid grid-cols-[340px_minmax(0,1fr)] items-center gap-5 rounded-[20px] border border-[#49404f] bg-[#26222d] p-[18px] max-[841px]:grid-cols-1 max-[841px]:items-stretch">
      <div className="col-start-1 row-start-1 grid min-h-28 grid-cols-[108px_minmax(0,1fr)] items-end gap-2 max-[841px]:min-h-0 max-[681px]:grid-cols-[82px_minmax(0,1fr)]">
        <Mascot state={feedback.state} priority />
        <RatDialogue feedback={feedback} />
      </div>
      <div className="col-start-2 row-start-1 min-w-0 max-[841px]:col-start-1 max-[841px]:row-start-2">
        <ExpenseInput
          value={inputValue}
          inputRef={inputRef}
          validationCode={validationCode}
          disabled={disabled}
          onValueChange={onInputChange}
          onSubmit={onSubmit}
        />
      </div>
    </section>
  );
}
