type WaveBandsProps = {
  className?: string;
  /** Inverte verticalmente (para usar no topo de uma seção). */
  flip?: boolean;
};

/**
 * As ondas coloridas da identidade KakalKids (sol, turquesa, cobalto, coral).
 * Puramente decorativo.
 */
export function WaveBands({ className = "", flip = false }: WaveBandsProps) {
  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block w-full ${flip ? "-scale-y-100" : ""} ${className}`}
    >
      <path
        d="M0 70 C 240 10, 420 120, 720 70 S 1200 10, 1440 60 L1440 160 L0 160 Z"
        className="fill-sol"
      />
      <path
        d="M0 95 C 260 40, 470 140, 760 95 S 1220 40, 1440 85 L1440 160 L0 160 Z"
        className="fill-turquesa"
      />
      <path
        d="M0 118 C 280 70, 500 160, 800 118 S 1240 70, 1440 110 L1440 160 L0 160 Z"
        className="fill-cobalto"
      />
      <path
        d="M0 140 C 300 105, 540 170, 840 140 S 1260 105, 1440 135 L1440 160 L0 160 Z"
        className="fill-coral"
      />
    </svg>
  );
}
