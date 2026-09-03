import Image from "next/image";

export type MascotProps = Readonly<{
  src: string;
  alt: string;
  priority?: boolean;
}>;

export function Mascot({ src, alt, priority = false }: MascotProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={116}
      height={116}
      priority={priority}
      className="size-[116px] max-w-none self-end object-contain max-[680px]:size-[88px]"
    />
  );
}
