import type { ReactNode } from "react";

export type AppShellProps = Readonly<{
  label: string;
  children: ReactNode;
}>;

export function AppShell({ label, children }: AppShellProps) {
  return (
    <section
      aria-label={label}
      className="min-w-0 overflow-hidden rounded-3xl border border-[#49404f] bg-[#18161e] text-[#f7f2fa]"
    >
      {children}
    </section>
  );
}
