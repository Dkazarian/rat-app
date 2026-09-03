import { LanguageControl } from "./language-control";

export type HeaderProps = Readonly<{
  appName: string;
}>;

export function Header({ appName }: HeaderProps) {
  const brandPrefix = appName.slice(0, 3);
  const brandSuffix = appName.slice(3);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[#49404f] bg-[#26222d] px-[22px] py-[18px] max-[680px]:p-[15px]">
      <h1
        aria-label={appName}
        className="inline-flex text-[1.35rem] font-black tracking-[-0.055em]"
      >
        <span aria-hidden="true">
          <span className="text-[#f7f2fa]">{brandPrefix}</span>
          <span className="text-[#ef9fa4]">{brandSuffix}</span>
        </span>
      </h1>
      <LanguageControl />
    </header>
  );
}
