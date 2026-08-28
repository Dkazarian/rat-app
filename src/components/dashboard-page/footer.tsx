export type FooterProps = Readonly<{
  poweredByLabel: string;
  model: string;
  sourceLabel: string;
  sourceAriaLabel: string;
  sourceHref: string;
}>;

export function Footer({
  poweredByLabel,
  model,
  sourceLabel,
  sourceAriaLabel,
  sourceHref,
}: FooterProps) {
  return (
    <footer className="mt-[10px] flex flex-wrap items-center justify-center gap-x-[14px] gap-y-[6px] bg-transparent px-[22px] py-[7px] text-center text-[0.88em] text-[#bbb1c1]">
      <span>
        {poweredByLabel} <span className="text-[#f7f2fa]">{model}</span>
      </span>
      <a
        href={sourceHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={sourceAriaLabel}
        className="font-medium text-[#a995e2] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#86afe0]"
      >
        {sourceLabel}
      </a>
    </footer>
  );
}
