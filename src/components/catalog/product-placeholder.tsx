import Image from "next/image";

const tints = ["bg-sol/35", "bg-turquesa/30", "bg-rosa/25", "bg-cobalto/20", "bg-coral/25"];

/** Fundo da marca para produtos ainda sem foto. */
export function ProductPlaceholder({ seed, className = "" }: { seed: string; className?: string }) {
  const tint = tints[[...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % tints.length];
  return (
    <div className={`flex items-center justify-center ${tint} ${className}`}>
      <Image src="/brand/logo-icone.png" alt="" width={96} height={96} className="aspect-square h-auto w-1/3 max-w-32 rounded-full opacity-90" />
    </div>
  );
}
