import type { ReactNode } from "react";

export type ResultsPanelProps = Readonly<{
  spendingSummary: ReactNode;
  expenseList: ReactNode;
}>;

export function ResultsPanel({
  spendingSummary,
  expenseList,
}: ResultsPanelProps) {
  return (
    <section className="grid min-w-0 gap-[18px] rounded-[20px] border border-[#49404f] bg-[#26222d] p-[18px]">
      {spendingSummary}
      <div className="border-t border-[#49404f] pt-[18px]">{expenseList}</div>
    </section>
  );
}
