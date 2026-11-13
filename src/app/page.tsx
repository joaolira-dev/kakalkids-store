import Image from "next/image";

const palette = [
  { name: "Coral", className: "bg-coral" },
  { name: "Sol", className: "bg-sol" },
  { name: "Cobalto", className: "bg-cobalto" },
  { name: "Rosa", className: "bg-rosa" },
  { name: "Turquesa", className: "bg-turquesa" },
  { name: "Marinho", className: "bg-marinho" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <Image
        src="/brand/logo-principal.png"
        alt="KakalKids Store — Vestindo criança como criança."
        width={1536}
        height={1024}
        priority
        className="h-auto w-full max-w-md"
      />
      <h1 className="text-3xl sm:text-4xl">Nossa loja virtual está chegando!</h1>
      <p className="max-w-prose text-lg text-marinho-soft">
        Enquanto isso, confira as novidades no nosso Instagram e faça seu pedido pelo WhatsApp.
      </p>
      <ul className="flex gap-3" aria-label="Paleta da marca">
        {palette.map((color) => (
          <li key={color.name} title={color.name} className={`size-8 rounded-full ${color.className}`} />
        ))}
      </ul>
    </main>
  );
}
