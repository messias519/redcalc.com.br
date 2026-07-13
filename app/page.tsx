import { InfusionTools } from "./components/InfusionTools";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "RedCalc",
    url: "https://redcalc.com.br",
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    description:
      "Calculadoras gratuitas de doses, infusão, gotas e apoio ao gerenciamento de PCR para profissionais e estudantes da saúde.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <InfusionTools />
    </>
  );
}
