import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClarityConsent } from "./components/ClarityConsent";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://redcalc.com.br"),
  title: {
    default: "RedCalc | Calculadoras para profissionais da saúde",
    template: "%s | RedCalc",
  },
  description:
    "Calculadoras gratuitas de doses, infusão, gotas e apoio ao gerenciamento de PCR para profissionais e estudantes da saúde.",
  applicationName: "RedCalc",
  authors: [{ name: "RedCalc", url: "https://redcalc.com.br" }],
  creator: "RedCalc",
  publisher: "RedCalc",
  keywords: [
    "calculadora de doses",
    "calculadora de infusão",
    "gotas por minuto",
    "microgotas por minuto",
    "contador de gotas",
    "gerenciamento de PCR",
    "calculadora enfermagem",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://redcalc.com.br",
    siteName: "RedCalc",
    title: "RedCalc | Calculadoras para profissionais da saúde",
    description:
      "Calculadoras gratuitas de doses, infusão, gotas e apoio ao gerenciamento de PCR.",
  },
  twitter: {
    card: "summary",
    title: "RedCalc | Calculadoras para profissionais da saúde",
    description:
      "Calculadoras gratuitas de doses, infusão, gotas e apoio ao gerenciamento de PCR.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={geist.variable}>
        {children}
        <ClarityConsent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
