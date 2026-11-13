import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { MapPin, MessageCircle } from "lucide-react";
import { WaveBands } from "@/components/brand/wave-bands";
import { InstagramIcon } from "@/components/brand/social-icons";
import { helpNav, mainNav, siteConfig, whatsappLink } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <WaveBands className="h-16 sm:h-24" />
      <div className="bg-marinho text-creme">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-xs">
            <Image
              src="/brand/logo-icone.png"
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full"
            />
            <p className="mt-4 font-display text-2xl font-semibold">{siteConfig.tagline}</p>
            <p className="mt-2 text-creme/80">
              Moda infantil e teen para meninas e meninos, do RN aos 18 anos.
            </p>
          </div>

          <FooterLinks title="Loja" items={mainNav} />
          <FooterLinks title="Ajuda" items={helpNav} />

          <div>
            <h2 className="font-display text-lg font-semibold text-sol">Fale com a gente</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a href={whatsappLink("Oi! Vim pelo site da KakalKids :)")} className="inline-flex items-center gap-2.5 hover:text-sol">
                  <MessageCircle className="size-5" aria-hidden="true" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={siteConfig.instagram.url} className="inline-flex items-center gap-2.5 hover:text-sol">
                  <InstagramIcon />
                  {siteConfig.instagram.handle}
                </a>
              </li>
              <li className="inline-flex items-center gap-2.5 text-creme/80">
                <MapPin className="size-5" aria-hidden="true" />
                {siteConfig.city}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-creme/15">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-creme/70 sm:flex-row sm:justify-between sm:px-6">
            <p>
              © <CopyrightYear /> {siteConfig.name}. Todos os direitos reservados.
            </p>
            <Link href="/privacidade" className="hover:text-sol">
              Política de privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-sol">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="hover:text-sol">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Ano capturado no HTML estático e revalidado diariamente (Cache Components)
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
