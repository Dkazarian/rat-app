import type { ReactNode } from "react";

export type DashboardLayoutProps = Readonly<{
  categoryPanel: ReactNode;
  resultsPanel: ReactNode;
}>;

export function DashboardLayout({
  categoryPanel,
  resultsPanel,
}: DashboardLayoutProps) {
  return (
    <div className="grid grid-cols-[220px_minmax(0,1fr)] items-stretch gap-[18px] max-[680px]:grid-cols-1">
      {categoryPanel}
      {resultsPanel}
    </div>
  );
}
