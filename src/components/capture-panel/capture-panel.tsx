import { ExpenseInput } from "./expense-input";
import type { ExpenseInputProps } from "./expense-input";
import { Mascot } from "./mascot";
import { RatDialogue } from "./rat-dialogue";
import type { RatDialogueProps } from "./rat-dialogue";

export type CapturePanelProps = Readonly<{
  dialogue: RatDialogueProps;
  input: ExpenseInputProps;
}>;

export function CapturePanel({ dialogue, input }: CapturePanelProps) {
  return (
    <section className="grid grid-cols-[270px_minmax(0,1fr)] items-center gap-5 rounded-[20px] border border-[#49404f] bg-[#26222d] p-[18px] max-[680px]:grid-cols-1 max-[680px]:items-stretch">
      <div className="col-start-1 row-start-1 grid min-h-28 grid-cols-[108px_minmax(0,1fr)] items-end gap-2 max-[680px]:min-h-0 max-[680px]:grid-cols-[82px_minmax(0,1fr)]">
        <Mascot src={dialogue.mascotSrc} alt={dialogue.mascotAlt} priority />
        <RatDialogue {...dialogue} />
      </div>
      <div className="col-start-2 row-start-1 min-w-0 max-[680px]:col-start-1 max-[680px]:row-start-2">
        <ExpenseInput {...input} />
      </div>
    </section>
  );
}
