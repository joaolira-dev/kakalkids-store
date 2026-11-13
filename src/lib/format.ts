const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number) {
  return brl.format(value);
}

/** "3x de R$ 19,97" — parcelamento sem juros a partir de R$ 100. */
export function installments(value: number, maxInstallments = 3, minValue = 100) {
  if (value < minValue) return null;
  return `${maxInstallments}x de ${brl.format(value / maxInstallments)}`;
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

/** Link de WhatsApp para o telefone do cliente (adiciona o DDI 55 quando falta). */
export function customerWhatsappLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  const base = `https://wa.me/${withCountry}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}
