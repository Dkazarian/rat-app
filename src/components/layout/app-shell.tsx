import type { ReactNode } from "react";

export type AppShellProps = Readonly<{
  label: string;
  children: ReactNode;
}>;

export function AppShell({ label, children }: AppShellProps) {
  return (
    <section
      aria-label={label}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-[#49404f] bg-[#18161e] text-[#f7f2fa]"
    >
      {children}
    </section>
  );
}
