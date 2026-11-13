import { formatPrice } from "@/lib/format";

type PriceProps = {
  price: number;
  compareAt?: number | null;
  fromLabel?: boolean;
  size?: "md" | "lg";
};

export function Price({ price, compareAt, fromLabel = false, size = "md" }: PriceProps) {
  const onSale = compareAt != null && compareAt > price;
  const off = onSale ? Math.round((1 - price / compareAt) * 100) : 0;

  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {onSale && (
        <s className="text-sm text-marinho-soft">
          <span className="sr-only">De </span>
          {formatPrice(compareAt)}
        </s>
      )}
      <span className={`font-display font-semibold ${size === "lg" ? "text-3xl" : "text-lg"}`}>
        {onSale && <span className="sr-only">Por </span>}
        {fromLabel && <span className="text-sm font-medium">a partir de </span>}
        {formatPrice(price)}
      </span>
      {onSale && (
        <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>
      )}
    </p>
  );
}
