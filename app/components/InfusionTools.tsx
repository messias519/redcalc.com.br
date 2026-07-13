"use client";

import { useEffect, useMemo, useState } from "react";
import { medications } from "../data/medications";
import { CprManager, useWakeLock } from "./CprManager";

type Tab = "dose" | "converter" | "counter" | "cpr";
type SetType = "macro" | "micro";
const factor = (set: SetType) => (set === "macro" ? 20 : 60);
const n = (value: string) => Number(value.replace(",", ".")) || 0;
const fmt = (value: number) => Number.isFinite(value) ? value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 }) : "—";

export function InfusionTools() {
  const [tab, setTab] = useState<Tab>("dose");
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#"><span>R</span>RedCalc</a>
        <div className="professional"><i /> Ferramenta para profissionais e estudantes</div>
      </header>
      <section className="hero">
        <p className="eyebrow">CALCULADORA VERMELHA</p>
        <h1>Precisão para decisões<br/><em>que importam.</em></h1>
        <p>Ferramentas rápidas para conferir doses e velocidades à beira-leito.</p>
      </section>
      <nav className="tabs" aria-label="Calculadoras">
        <button className={tab === "dose" ? "active" : ""} onClick={() => setTab("dose")}><b>01</b><span>Calculadora de<br/>dose infundida</span></button>
        <button className={tab === "converter" ? "active" : ""} onClick={() => setTab("converter")}><b>02</b><span>Conversor de<br/>infusão</span></button>
        <button className={tab === "counter" ? "active" : ""} onClick={() => setTab("counter")}><b>03</b><span>Contador de<br/>gotas</span></button>
        <button className={tab === "cpr" ? "active" : ""} onClick={() => setTab("cpr")}><b>04</b><span>Gerenciamento<br/>de PCR</span></button>
      </nav>
      <section className="workspace">
        {tab === "dose" && <DoseCalculator />}
        {tab === "converter" && <Converter />}
        {tab === "counter" && <DropCounter />}
        <div hidden={tab !== "cpr"} aria-hidden={tab !== "cpr"}><CprManager /></div>
      </section>
      <footer><strong>Uso educacional e de apoio.</strong> Confirme todo cálculo com a prescrição, a bula e o protocolo institucional. Não substitui julgamento clínico.</footer>
    </main>
  );
}

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix: string }) {
  return <label className="field"><span>{label}</span><div><input inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} /><b>{suffix}</b></div></label>;
}

function DoseCalculator() {
  const [medId, setMedId] = useState(medications[3].id);
  const med = medications.find(m => m.id === medId)!;
  const [weight, setWeight] = useState("70");
  const [rate, setRate] = useState("10");
  const [rateMode, setRateMode] = useState<"ml" | "drops">("ml");
  const [setType, setSetType] = useState<SetType>("macro");
  const initialDilution = med.dilutions[0];
  const [dilutionId, setDilutionId] = useState(initialDilution.id);
  const [drugVolume, setDrugVolume] = useState(String(initialDilution.drugVolume));
  const [diluentVolume, setDiluentVolume] = useState(String(initialDilution.diluentVolume));
  const [drugConcentration, setDrugConcentration] = useState(String(initialDilution.drugConcentration));
  const [showMath, setShowMath] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("redcalc-custom-dilutions") || "{}")[medId];
        if (saved) {
          setDilutionId("custom");
          setDrugVolume(saved.drugVolume);
          setDiluentVolume(saved.diluentVolume);
          setDrugConcentration(saved.drugConcentration);
        }
      } catch { /* armazenamento indisponível ou inválido */ }
    });
    return () => cancelAnimationFrame(frame);
  }, [medId]);

  const applyDilution = (selected: typeof initialDilution) => {
    setDilutionId(selected.id);
    setDrugVolume(String(selected.drugVolume));
    setDiluentVolume(String(selected.diluentVolume));
    setDrugConcentration(String(selected.drugConcentration));
  };
  const selectMedication = (id: string) => {
    const selected = medications.find(item => item.id === id)!;
    setMedId(id);
    try {
      const saved = JSON.parse(localStorage.getItem("redcalc-custom-dilutions") || "{}")[id];
      if (saved) {
        setDilutionId("custom"); setDrugVolume(saved.drugVolume); setDiluentVolume(saved.diluentVolume); setDrugConcentration(saved.drugConcentration);
      } else applyDilution(selected.dilutions[0]);
    } catch { applyDilution(selected.dilutions[0]); }
  };
  const selectDilution = (id: string) => applyDilution(med.dilutions.find(item => item.id === id)!);
  const customize = (field: "drugVolume" | "diluentVolume" | "drugConcentration", value: string) => {
    const custom = { drugVolume, diluentVolume, drugConcentration, [field]: value };
    setDilutionId("custom");
    if (field === "drugVolume") setDrugVolume(value);
    if (field === "diluentVolume") setDiluentVolume(value);
    if (field === "drugConcentration") setDrugConcentration(value);
    try {
      const all = JSON.parse(localStorage.getItem("redcalc-custom-dilutions") || "{}");
      localStorage.setItem("redcalc-custom-dilutions", JSON.stringify({ ...all, [medId]: custom }));
    } catch { /* armazenamento opcional */ }
  };
  const mlh = rateMode === "ml" ? n(rate) : n(rate) * 60 / factor(setType);
  const amount = n(drugVolume) * n(drugConcentration);
  const volume = n(drugVolume) + n(diluentVolume);
  const concentration = amount / volume;
  let dose = concentration * mlh;
  if (med.amountUnit === "mg" && med.doseUnit.startsWith("mcg")) dose *= 1000;
  if (med.doseUnit.endsWith("/min")) dose /= 60;
  if (med.doseUnit.includes("/kg/")) dose /= n(weight);
  const outside = !!(dose && ((med.min != null && dose < med.min) || (med.max != null && dose > med.max)));

  return <div className="tool-grid">
    <div className="panel form-panel">
      <div className="section-heading"><span>01</span><div><h2>Dados da infusão</h2><p>Informe a solução e a velocidade atual.</p></div></div>
      <label className="select-field"><span>Medicamento</span><select value={medId} onChange={e => selectMedication(e.target.value)}>{medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <Field label="Peso" value={weight} onChange={setWeight} suffix="kg" />
      {!med.doseUnit.includes("/kg/") && <p className="field-note">Esta medicação não utiliza o peso no cálculo da unidade selecionada.</p>}
      <div className="segmented"><button className={rateMode === "ml" ? "active" : ""} onClick={() => setRateMode("ml")}>mL/h</button><button className={rateMode === "drops" ? "active" : ""} onClick={() => setRateMode("drops")}>gotas/min</button></div>
      {rateMode === "drops" && <SetSelector value={setType} onChange={setSetType} />}
      <Field label="Velocidade" value={rate} onChange={setRate} suffix={rateMode === "ml" ? "mL/h" : "gts/min"} />
      <div className="dilution">
        <div><span>Preparo da solução</span><small>Editável conforme protocolo</small></div>
        <label className="select-field"><span>Diluição sugerida</span><select value={dilutionId} onChange={e => selectDilution(e.target.value)}>{dilutionId === "custom" && <option value="custom">Personalizada (salva neste dispositivo)</option>}{med.dilutions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div className="dilution-fields">
          <Field label="Volume da droga" value={drugVolume} onChange={value => customize("drugVolume", value)} suffix="mL" />
          <Field label="Volume do diluente" value={diluentVolume} onChange={value => customize("diluentVolume", value)} suffix="mL" />
          <Field label="Concentração da droga" value={drugConcentration} onChange={value => customize("drugConcentration", value)} suffix={`${med.amountUnit}/mL`} />
        </div>
        <div className="solution-summary"><span>Quantidade total: <b>{fmt(amount)} {med.amountUnit}</b></span><span>Volume final: <b>{fmt(volume)} mL</b></span></div>
      </div>
    </div>
    <div className={`panel result-panel ${outside ? "warning" : ""}`}>
      <p className="result-label">DOSE CALCULADA</p><div className="big-result">{fmt(dose)}<span>{med.doseUnit}</span></div>
      <div className="range"><span>Faixa de referência</span><strong>{med.min != null ? fmt(med.min) : "—"} – {med.max != null ? fmt(med.max) : "—"} {med.doseUnit}</strong></div>
      {outside && <div className="alert">Atenção: resultado fora da faixa de referência.</div>}
      <p className="reference">{med.reference}</p>
      <button className="math-toggle" onClick={() => setShowMath(!showMath)}>{showMath ? "Ocultar cálculo" : "Ver como calculamos"} <span>{showMath ? "−" : "+"}</span></button>
      {showMath && <div className="math">Concentração: {fmt(concentration)} {med.amountUnit}/mL<br/>Velocidade equivalente: {fmt(mlh)} mL/h<br/>Dose = concentração × velocidade {med.doseUnit.includes("/kg/") ? "÷ peso" : ""} {med.doseUnit.endsWith("/min") ? "÷ 60" : ""}</div>}
    </div>
  </div>;
}

function SetSelector({ value, onChange }: { value: SetType; onChange: (v: SetType) => void }) {
  return <div className="set-choice"><button className={value === "macro" ? "active" : ""} onClick={() => onChange("macro")}><b>Macrogotas</b><small>20 gotas/mL</small></button><button className={value === "micro" ? "active" : ""} onClick={() => onChange("micro")}><b>Microgotas</b><small>60 gotas/mL</small></button></div>;
}

function Converter() {
  const [setType, setSetType] = useState<SetType>("macro");
  const [direction, setDirection] = useState<"ml" | "drops">("ml");
  const [value, setValue] = useState("60");
  const result = direction === "ml" ? n(value) * factor(setType) / 60 : n(value) * 60 / factor(setType);
  return <div className="panel single-tool"><div className="section-heading"><span>02</span><div><h2>Conversor de infusão</h2><p>Conversão instantânea entre volume e gotejamento.</p></div></div><SetSelector value={setType} onChange={setSetType}/><div className="converter-row"><Field label={direction === "ml" ? "Volume por hora" : "Gotejamento"} value={value} onChange={setValue} suffix={direction === "ml" ? "mL/h" : "gts/min"}/><button className="swap" onClick={() => setDirection(direction === "ml" ? "drops" : "ml")} aria-label="Inverter conversão">⇄</button><div className="converted"><span>Resultado</span><strong>{fmt(result)}</strong><b>{direction === "ml" ? "gotas/min" : "mL/h"}</b></div></div><p className="formula">Fator utilizado: {factor(setType)} gotas por mL.</p></div>;
}

function DropCounter() {
  const [setType, setSetType] = useState<SetType>("macro");
  const [times, setTimes] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [vibration, setVibration] = useState(true);
  useWakeLock(true);
  const addDrop = () => {
    if (paused) return;
    const now = performance.now();
    setTimes(t => [...t.slice(-9), now]);
    if (vibration && navigator.vibrate) navigator.vibrate(18);
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) { e.preventDefault(); addDrop(); } };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  });
  const dropsMin = useMemo(() => times.length < 2 ? 0 : (times.length - 1) * 60000 / (times[times.length - 1] - times[0]), [times]);
  const micro = dropsMin * 60 / factor(setType);
  const mlh = dropsMin * 60 / factor(setType);
  const restart = () => { setTimes([]); setPaused(false); };
  return <div className="counter-layout"><div className="panel"><div className="section-heading"><span>03</span><div><h2>Contador de gotas</h2><p>Toque no ritmo das gotas ou use a barra de espaço.</p></div></div><SetSelector value={setType} onChange={setSetType}/><button className={`tap-zone ${paused ? "paused" : ""}`} onClick={addDrop}><i>{paused ? "II" : "+"}</i><strong>{paused ? "Contagem pausada" : "Registrar gota"}</strong><span>{times.length} {times.length === 1 ? "gota registrada" : "gotas registradas"}</span></button><div className="counter-actions"><button onClick={() => setPaused(!paused)}>{paused ? "Continuar" : "Pausar"}</button><button onClick={restart}>Recomeçar</button><label><input type="checkbox" checked={vibration} onChange={e => setVibration(e.target.checked)}/> Vibração</label></div><p className="wake-note">A tela será mantida ativa enquanto esta ferramenta estiver aberta, quando permitido pelo aparelho.</p></div><div className="panel live-results"><p className="result-label">VELOCIDADE ESTIMADA</p><div className="metric primary"><strong>{fmt(dropsMin)}</strong><span>gotas/min</span></div><div className="metric"><strong>{fmt(micro)}</strong><span>microgotas/min</span></div><div className="metric"><strong>{fmt(mlh)}</strong><span>mL/h</span></div><small>A estimativa fica mais estável conforme novas gotas são registradas.</small></div></div>;
}
