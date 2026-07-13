import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RedCalc — Calculadora Vermelha",
    short_name: "RedCalc",
    description:
      "Calculadoras gratuitas de doses, infusão, gotas e apoio ao gerenciamento de PCR.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4f1",
    theme_color: "#df1721",
    lang: "pt-BR",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
