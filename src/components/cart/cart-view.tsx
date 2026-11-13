"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, MessageCircle, Minus, Plus, Tag, Trash2 } from "lucide-react";
import { ProductPlaceholder } from "@/components/catalog/product-placeholder";
import { deliveryOptions, type DeliveryMethod } from "@/config/site";
import { cart, useCart, useCartReady, type CartItem } from "@/lib/cart/store";
import { placeOrder, previewCoupon } from "@/lib/checkout/actions";
import { formatPrice } from "@/lib/format";

type AppliedCoupon = { code: string; discount: number };

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function CartView() {
  const items = useCart();
  const ready = useCartReady();
  const [placed, setPlaced] = useState<{ orderNumber: number; whatsappUrl: string } | null>(null);

  if (placed) return <OrderPlaced {...placed} />;
  if (!ready) return <CartSkeleton />;
  if (items.length === 0) return <EmptyCart />;

  return <Checkout items={items} onPlaced={setPlaced} />;
}

function Checkout({
  items,
  onPlaced,
}: {
  items: CartItem[];
  onPlaced: (r: { orderNumber: number; whatsappUrl: string }) => void;
}) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checkingCoupon, startCoupon] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<DeliveryMethod | null>(null);
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  // Revalida o cupom quando a sacola muda (o valor mínimo pode deixar de ser atingido)
  const couponCode = coupon?.code;
  useEffect(() => {
    if (!couponCode) return;
    let cancelled = false;
    previewCoupon(couponCode, subtotal).then((r) => {
      if (cancelled) return;
      if (r.valid) setCoupon({ code: couponCode, discount: r.discount });
      else {
        setCoupon(null);
        setCouponMsg({ ok: false, text: r.message });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [couponCode, subtotal]);

  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  function applyCoupon(e?: { preventDefault(): void }) {
    e?.preventDefault();
    const code = couponInput.trim();
    if (!code) return;
    startCoupon(async () => {
      const r = await previewCoupon(code, subtotal);
      if (r.valid) {
        setCoupon({ code: code.toUpperCase(), discount: r.discount });
        setCouponMsg({ ok: true, text: `Cupom ${code.toUpperCase()} aplicado` });
        setCouponInput("");
      } else {
        setCouponMsg({ ok: false, text: r.message });
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!delivery) {
      setError("Escolha a forma de entrega.");
      return;
    }
    startSubmit(async () => {
      const result = await placeOrder({
        name,
        phone,
        delivery,
        notes,
        coupon: coupon?.code ?? null,
        website,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      cart.clear();
      onPlaced({ orderNumber: result.orderNumber, whatsappUrl: result.whatsappUrl });
      window.location.href = result.whatsappUrl;
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-start">
      {/* Itens */}
      <section aria-labelledby="itens">
        <h2 id="itens" className="sr-only">
          Itens da sacola
        </h2>
        <ul className="divide-y-2 divide-marinho/10 rounded-[2rem] bg-white px-4 sm:px-6">
          {items.map((item) => (
            <CartLine key={item.variantId} item={item} />
          ))}
        </ul>
        <Link href="/catalogo" className="mt-4 inline-block font-bold underline underline-offset-4">
          Continuar comprando
        </Link>
      </section>

      {/* Resumo e finalização */}
      <form onSubmit={submit} className="relative flex flex-col gap-6 rounded-[2rem] bg-white p-6 sm:p-7 lg:sticky lg:top-32" noValidate>
        <div>
          <h2 className="text-2xl">Resumo</h2>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between">
              <dt>
                Subtotal ({count} {count === 1 ? "peça" : "peças"})
              </dt>
              <dd className="font-semibold">{formatPrice(subtotal)}</dd>
            </div>
            {coupon && (
              <div className="flex justify-between text-cobalto">
                <dt className="flex items-center gap-2">
                  Cupom {coupon.code}
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCouponMsg(null);
                    }}
                    className="text-sm text-marinho-soft underline"
                  >
                    remover
                  </button>
                </dt>
                <dd className="font-semibold">−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-marinho/10 pt-3 font-display text-2xl font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-sm text-marinho-soft">Frete combinado no WhatsApp, quando houver.</p>
        </div>

        {!coupon && (
          <div>
            <label htmlFor="cupom" className="font-semibold">
              Cupom de desconto
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-marinho-soft" aria-hidden="true" />
                <input
                  id="cupom"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon(e)}
                  autoCapitalize="characters"
                  className="h-12 w-full rounded-2xl border-2 border-marinho/15 bg-creme/50 pr-3 pl-10 uppercase placeholder:normal-case focus:border-marinho focus:outline-none"
                  placeholder="Digite o código"
                />
              </div>
              <button
                type="button"
                onClick={() => applyCoupon()}
                disabled={checkingCoupon || !couponInput.trim()}
                className="h-12 rounded-2xl bg-marinho px-4 font-bold text-creme disabled:opacity-40"
              >
                {checkingCoupon ? <Loader2 className="size-5 animate-spin" aria-label="Validando" /> : "Aplicar"}
              </button>
            </div>
            {couponMsg && (
              <p role="status" className={`mt-2 text-sm font-semibold ${couponMsg.ok ? "text-cobalto" : "text-coral"}`}>
                {couponMsg.text}
              </p>
            )}
          </div>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-display text-xl font-semibold">Seus dados</legend>
          <Field label="Nome" id="nome">
            <input
              id="nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp" id="telefone">
            <input
              id="telefone"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(83) 99999-9999"
              required
              className={inputClass}
            />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xl font-semibold">Entrega</legend>
          <div className="mt-3 flex flex-col gap-2">
            {deliveryOptions.map((option) => {
              const active = delivery === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 transition-colors ${active ? "border-marinho bg-sol/30" : "border-marinho/15 hover:border-marinho/50"}`}
                >
                  <input
                    type="radio"
                    name="entrega"
                    value={option.value}
                    checked={active}
                    onChange={() => setDelivery(option.value)}
                    className="mt-1 size-4 accent-marinho"
                  />
                  <span>
                    <span className="block font-bold">{option.label}</span>
                    <span className="block text-sm text-marinho-soft">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label="Observações (opcional)" id="obs">
          <textarea
            id="obs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ex.: é para presente, horário para retirada…"
            className={`${inputClass} h-auto py-3`}
          />
        </Field>

        {/* Armadilha para robôs: invisível para pessoas e leitores de tela */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Não preencha este campo</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-coral/15 p-3.5 font-semibold text-marinho">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-rosa px-6 font-display text-lg font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Registrando pedido…
            </>
          ) : (
            <>
              <MessageCircle className="size-5" aria-hidden="true" />
              Finalizar pelo WhatsApp
            </>
          )}
        </button>
        <p className="-mt-3 text-center text-sm text-marinho-soft">
          Seu pedido é registrado e o WhatsApp abre com a mensagem pronta para enviar.
        </p>
      </form>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border-2 border-marinho/15 bg-creme/50 px-4 focus:border-marinho focus:outline-none";

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function CartLine({ item }: { item: CartItem }) {
  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/produto/${item.productSlug}`}
        className="relative block aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-2xl bg-creme-dark sm:w-28"
      >
        {item.image ? (
          <Image src={item.image} alt="" fill sizes="7rem" className="object-cover" />
        ) : (
          <ProductPlaceholder seed={item.productSlug} className="absolute inset-0" />
        )}
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/produto/${item.productSlug}`} className="font-bold hover:underline">
              {item.name}
            </Link>
            <p className="text-sm text-marinho-soft">
              {[item.color, `Tam. ${item.size}`].filter(Boolean).join(" · ")}
            </p>
          </div>
          <p className="font-display text-lg font-semibold whitespace-nowrap">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex h-10 items-center rounded-full ring-2 ring-marinho/15">
            <button
              type="button"
              onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex size-10 items-center justify-center disabled:opacity-30"
              aria-label={`Diminuir quantidade de ${item.name}`}
            >
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center font-bold">{item.quantity}</span>
            <button
              type="button"
              onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)}
              disabled={item.quantity >= item.maxQuantity}
              className="flex size-10 items-center justify-center disabled:opacity-30"
              aria-label={`Aumentar quantidade de ${item.name}`}
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => cart.remove(item.variantId)}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-marinho-soft hover:bg-coral/10 hover:text-marinho"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remover
          </button>
        </div>
      </div>
    </li>
  );
}

function OrderPlaced({ orderNumber, whatsappUrl }: { orderNumber: number; whatsappUrl: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-[2rem] bg-white px-6 py-14 text-center" role="status">
      <span className="flex size-16 items-center justify-center rounded-full bg-turquesa">
        <Check className="size-8" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-3xl">Pedido #{orderNumber} registrado!</h2>
      <p className="mt-3 text-marinho-soft">
        Agora é só enviar a mensagem no WhatsApp. A gente confirma a disponibilidade, a entrega e o pagamento por lá.
      </p>
      <a
        href={whatsappUrl}
        className="mt-7 flex h-14 items-center gap-2.5 rounded-full bg-rosa px-8 font-display text-lg font-semibold text-white"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        Abrir o WhatsApp
      </a>
      <Link href="/catalogo" className="mt-5 font-bold underline underline-offset-4">
        Voltar para a loja
      </Link>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-[2rem] bg-white px-6 py-16 text-center">
      <h2 className="text-3xl">Sua sacola está vazia</h2>
      <p className="mt-3 text-marinho-soft">Escolha as peças no catálogo e elas aparecem aqui.</p>
      <Link
        href="/catalogo"
        className="mt-7 rounded-full bg-marinho px-7 py-3.5 font-display text-lg font-semibold text-creme hover:bg-cobalto"
      >
        Ver o catálogo
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-10 motion-reduce:animate-none lg:grid-cols-[1fr_24rem]">
      <div className="h-80 rounded-[2rem] bg-creme-dark" />
      <div className="h-[28rem] rounded-[2rem] bg-creme-dark" />
    </div>
  );
}
