import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "KakalKids Store | Moda infantil e teen",
    template: "%s | KakalKids Store",
  },
  description:
    "Vestindo criança como criança. Moda infantil e teen para meninas e meninos, do RN aos 18 anos, em João Pessoa - PB.",
  openGraph: {
    siteName: "KakalKids Store",
    locale: "pt_BR",
    type: "website",
    images: ["/brand/logo-principal.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff9ef",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-sol focus:px-4 focus:py-2"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
