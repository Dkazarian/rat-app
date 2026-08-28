import type { RatDialogueProps } from "@/types/presentation";

type DialogueProps = Pick<
  RatDialogueProps,
  "announcement" | "detail" | "state" | "title"
>;

export function RatDialogue({
  announcement,
  detail,
  state,
  title,
}: DialogueProps) {
  const isUrgent = announcement === "assertive";

  return (
    <div
      role={isUrgent ? "alert" : undefined}
      aria-live={isUrgent ? undefined : "polite"}
      data-state={state}
      className="relative min-w-0 self-start rounded-[18px_18px_18px_5px] border border-[#49404f] bg-[#26222d] px-[14px] py-[13px] before:absolute before:bottom-[10px] before:left-[-9px] before:size-4 before:rotate-45 before:border-b before:border-l before:border-[#49404f] before:bg-[#26222d] before:content-['']"
    >
      <p className="relative z-10 mb-[3px] font-medium">{title}</p>
      <p className="relative z-10 text-[#bbb1c1]">{detail}</p>
    </div>
  );
}
