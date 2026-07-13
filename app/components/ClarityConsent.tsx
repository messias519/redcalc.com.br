"use client";

import { useEffect, useState } from "react";

const PROJECT_ID = "xlzebo5btg";
const CONSENT_KEY = "redcalc-clarity-consent";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

function loadClarity() {
  if (document.querySelector(`script[data-clarity-project="${PROJECT_ID}"]`)) return;

  window.clarity =
    window.clarity ||
    function clarity(...args: unknown[]) {
      (window.clarity as unknown as { q?: unknown[] }).q =
        (window.clarity as unknown as { q?: unknown[] }).q || [];
      (window.clarity as unknown as { q: unknown[] }).q.push(args);
    };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
  script.dataset.clarityProject = PROJECT_ID;
  document.head.appendChild(script);
}

export function ClarityConsent() {
  const [decision, setDecision] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (saved === "accepted") {
      queueMicrotask(() => setDecision("accepted"));
      loadClarity();
    } else if (saved === "declined") {
      queueMicrotask(() => setDecision("declined"));
    }
  }, []);

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(CONSENT_KEY, value);
    setDecision(value);
    if (value === "accepted") loadClarity();
  }

  if (decision !== null) return null;

  return (
    <aside className="privacy-consent" aria-label="Preferências de privacidade">
      <div>
        <strong>Ajude a melhorar o RedCalc</strong>
        <p>
          Podemos coletar cliques e dados anônimos de uso. Campos, relatórios e dados
          informados nas calculadoras não são enviados.
        </p>
      </div>
      <div className="privacy-consent-actions">
        <button type="button" onClick={() => choose("declined")}>Recusar</button>
        <button type="button" className="primary" onClick={() => choose("accepted")}>
          Aceitar métricas
        </button>
      </div>
    </aside>
  );
}
