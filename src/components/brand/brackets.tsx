type BracketsProps = {
  children: React.ReactNode;
  className?: string;
  /** Cores dos 4 arcos, no sentido horário a partir do canto superior esquerdo. */
  colors?: [string, string, string, string];
};

/**
 * Moldura de "parênteses" coloridos, inspirada no logo (o K entre arcos).
 */
export function Brackets({
  children,
  className = "",
  colors = ["stroke-cobalto", "stroke-sol", "stroke-turquesa", "stroke-coral"],
}: BracketsProps) {
  const [tl, tr, br, bl] = colors;
  const arc = "fill-none [stroke-linecap:round] [stroke-width:7]";

  return (
    <div className={`relative ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute -top-1 -left-1 size-8">
        <path d="M6 34 A 28 28 0 0 1 34 6" className={`${arc} ${tl}`} />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute -top-1 -right-1 size-8">
        <path d="M6 6 A 28 28 0 0 1 34 34" className={`${arc} ${tr}`} />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute -right-1 -bottom-1 size-8">
        <path d="M34 6 A 28 28 0 0 1 6 34" className={`${arc} ${br}`} />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute -bottom-1 -left-1 size-8">
        <path d="M34 34 A 28 28 0 0 1 6 6" className={`${arc} ${bl}`} />
      </svg>
      {children}
    </div>
  );
}
