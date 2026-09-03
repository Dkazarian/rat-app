import Image from "next/image";

export type MascotCardProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function MascotCard({ eyebrow, title, description }: MascotCardProps) {
  return (
    <section className="w-full max-w-xl overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-xl shadow-amber-950/10">
      <div className="grid items-center gap-6 p-8 sm:grid-cols-[10rem_1fr] sm:p-10">
        <div className="mx-auto grid size-40 place-items-center rounded-full bg-amber-100">
          <Image
            src="/assets/rat-mascot.png"
            alt="Ratapp mascot"
            width={144}
            height={144}
            priority
          />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm font-bold tracking-widest text-amber-700 uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">
            {title}
          </h1>
          <p className="mt-3 leading-7 text-stone-600">{description}</p>
        </div>
      </div>
    </section>
  );
}
