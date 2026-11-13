type Props = {
  title: string;
  intro?: string;
  children: React.ReactNode;
};

/** Moldura das páginas de texto (como comprar, entregas, trocas...). */
export function ContentPage({ title, intro, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20 sm:px-6">
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      {intro && <p className="mt-4 text-lg text-marinho-soft">{intro}</p>}
      <div className="mt-10 flex flex-col gap-8">{children}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] bg-white p-6 sm:p-8">
      <h2 className="text-2xl">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-marinho-soft [&_strong]:text-marinho">{children}</div>
    </section>
  );
}
