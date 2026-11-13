const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number) {
  return brl.format(value);
}

/** "3x de R$ 19,97" — parcelamento sem juros a partir de R$ 100. */
export function installments(value: number, maxInstallments = 3, minValue = 100) {
  if (value < minValue) return null;
  return `${maxInstallments}x de ${brl.format(value / maxInstallments)}`;
}
