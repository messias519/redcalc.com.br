"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";

type CprEvent = { at: number; label: string };
const clock = (seconds: number) => `${String(Math.floor(Math.abs(seconds) / 60)).padStart(2, "0")}:${String(Math.abs(seconds) % 60).padStart(2, "0")}`;

export function useWakeLock(active: boolean) {
  useEffect(() => {
    let released = false;
    let sentinel: WakeLockSentinel | undefined;
    const acquire = async () => {
      if (!active || !("wakeLock" in navigator)) return;
      try { sentinel = await navigator.wakeLock.request("screen"); } catch { /* recurso opcional */ }
    };
    acquire();
    const onVisibility = () => { if (!released && document.visibilityState === "visible") acquire(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { released = true; document.removeEventListener("visibilitychange", onVisibility); sentinel?.release(); };
  }, [active]);
}

export function CprManager() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [events, setEvents] = useState<CprEvent[]>([]);
  const [shockable, setShockable] = useState<"yes" | "no" | null>(null);
  const [showRhythm, setShowRhythm] = useState(false);
  const [rhythmOpenedAt, setRhythmOpenedAt] = useState(0);
  const [finished, setFinished] = useState(false);
  const [phone, setPhone] = useState("");
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [lastEpi, setLastEpi] = useState(0);
  const [lastCompressor, setLastCompressor] = useState(0);
  const [lastRhythm, setLastRhythm] = useState(0);
  const [metronome, setMetronome] = useState(false);
  const [bpm, setBpm] = useState(110);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedAtRunStart, setElapsedAtRunStart] = useState(0);
  const alarmContext = useRef<AudioContext | null>(null);
  useWakeLock(running);
  const epiRemaining = 240 - (elapsed - lastEpi);
  const compressorRemaining = 120 - (elapsed - lastCompressor);
  const rhythmRemaining = 120 - (elapsed - lastRhythm);
  const rhythmVisible = showRhythm && elapsed - rhythmOpenedAt < 30;
  const overdue = running && (epiRemaining <= 0 || compressorRemaining <= 0 || rhythmRemaining <= 0);

  useEffect(() => {
    if (!running || runStartedAt == null) return;
    const update = () => setElapsed(elapsedAtRunStart + Math.floor((Date.now() - runStartedAt) / 1000));
    update();
    const timer = window.setInterval(update, 500);
    return () => window.clearInterval(timer);
  }, [running, runStartedAt, elapsedAtRunStart]);

  useEffect(() => {
    if (!metronome) return;
    const context = new window.AudioContext();
    const tick = () => {
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.frequency.value = 880; gain.gain.setValueAtTime(0.13, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.045);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.05);
    };
    tick(); const timer = window.setInterval(tick, 60000 / bpm);
    return () => { window.clearInterval(timer); context.close(); };
  }, [metronome, bpm]);

  useEffect(() => {
    if (!overdue || !running) return;
    const beep = () => {
      const context = alarmContext.current;
      if (!context) return;
      context.resume().catch(() => undefined);
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "square"; oscillator.frequency.value = 760;
      gain.gain.setValueAtTime(0.1, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.2);
    };
    beep(); const timer = window.setInterval(beep, 1800);
    return () => window.clearInterval(timer);
  }, [overdue, running]);

  const addEvent = (label: string) => setEvents(items => [...items, { at: elapsed, label }]);
  const start = () => {
    if (!alarmContext.current) alarmContext.current = new window.AudioContext();
    alarmContext.current.resume().catch(() => undefined);
    if (!startedAt) { setStartedAt(new Date()); addEvent("PCR iniciada"); }
    setElapsedAtRunStart(elapsed); setRunStartedAt(Date.now()); setRunning(true);
  };
  const pause = () => { setElapsedAtRunStart(elapsed); setRunStartedAt(null); setRunning(false); };
  const action = (kind: "epi" | "compressor" | "rhythm", label: string) => {
    addEvent(label);
    if (kind === "epi") setLastEpi(elapsed);
    if (kind === "compressor") setLastCompressor(elapsed);
    if (kind === "rhythm") { setLastRhythm(elapsed); setShowRhythm(true); setRhythmOpenedAt(elapsed); setShockable(null); }
  };
  const selectRhythm = (value: "yes" | "no") => {
    setShockable(value);
    const description = value === "yes" ? "chocável (FV/TV sem pulso)" : "não chocável (AESP/assistolia)";
    setEvents(items => {
      const index = items.map(item => item.label).lastIndexOf("Checagem de ritmo");
      if (index < 0) return [...items, { at: elapsed, label: `Checagem de ritmo — ${description}` }];
      return items.map((item, itemIndex) => itemIndex === index ? { ...item, label: `Checagem de ritmo — ${description}` } : item);
    });
  };
  const timerLabel = (remaining: number) => remaining > 0 ? `Faltam ${clock(remaining)}` : `ATRASADO +${clock(remaining)}`;

  const report = useMemo(() => {
    const beginning = startedAt?.toLocaleString("pt-BR") ?? "não informado";
    return ["RELATÓRIO DE PCR — RedCalc", `Início: ${beginning}`, `Duração: ${clock(elapsed)}`, "", ...events.map(event => `${clock(event.at)} — ${event.label}`), "", "Registro de apoio; revisar e complementar no prontuário."].join("\n");
  }, [elapsed, events, startedAt]);

  const finish = (label = "Procedimento finalizado") => { addEvent(label); setRunning(false); setRunStartedAt(null); setMetronome(false); setFinished(true); };
  const reset = () => { setRunning(false); setRunStartedAt(null); setElapsedAtRunStart(0); setMetronome(false); setElapsed(0); setEvents([]); setShockable(null); setShowRhythm(false); setRhythmOpenedAt(0); setFinished(false); setStartedAt(null); setLastEpi(0); setLastCompressor(0); setLastRhythm(0); };
  const copy = async () => navigator.clipboard.writeText(report);
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    const local = digits.slice(2);
    const prefixLength = local.length > 8 ? 5 : 4;
    if (local.length <= prefixLength) return `(${digits.slice(0, 2)}) ${local}`;
    return `(${digits.slice(0, 2)}) ${local.slice(0, prefixLength)}-${local.slice(prefixLength)}`;
  };
  const whatsapp = () => window.open(`https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(report)}`, "_blank", "noopener,noreferrer");
  const telegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent("https://redcalc.com.br")}&text=${encodeURIComponent(report)}`, "_blank", "noopener,noreferrer");

  return <div className={`cpr-app ${overdue ? "overdue" : ""}`}>
    <div className="cpr-top panel">
      <div><p className="eyebrow">GERENCIAMENTO DE PCR · ADULTO</p><h2>Tempo de PCR</h2></div>
      <div className="cpr-clock">{clock(elapsed)}</div>
      <div className="cpr-controls">{!running && !finished && <button className="primary-action" onClick={start}>{elapsed ? "Continuar" : "Iniciar PCR"}</button>}{running && <button onClick={pause}>Pausar</button>}<button onClick={reset}>Reiniciar</button></div>
    </div>

    {!finished ? <div className={`cpr-grid ${rhythmVisible ? "" : "single"}`}>
      <section className="panel cpr-actions">
        <h3>Ações rápidas</h3>
        <button className={epiRemaining <= 0 ? "due" : ""} onClick={() => action("epi", "Adrenalina 1 mg IV/IO registrada")}><span>Registrar adrenalina <time>{timerLabel(epiRemaining)}</time></span><small>1 mg IV/IO · referência de 4 min dentro da janela de 3–5 min</small></button>
        <button className={compressorRemaining <= 0 ? "due" : ""} onClick={() => action("compressor", "Troca de compressor")}><span>Trocar compressor <time>{timerLabel(compressorRemaining)}</time></span><small>Aproximadamente a cada 2 min</small></button>
        <button className={rhythmRemaining <= 0 ? "due" : ""} onClick={() => action("rhythm", "Checagem de ritmo")}><span>Checar ritmo <time>{timerLabel(rhythmRemaining)}</time></span><small>A cada 2 min · minimizar interrupções</small></button>
        <button onClick={() => finish("Retorno à circulação espontânea — fim da RCP")}>Retorno à circulação espontânea <small>Fim da RCP e geração do relatório</small></button>
        <div className="metronome"><div><b>Guia de compressões</b><small>Metrônomo independente do cronômetro da PCR</small></div><input aria-label="Batimentos por minuto" type="range" min="100" max="120" value={bpm} onChange={event => setBpm(Number(event.target.value))}/><strong>{bpm} BPM</strong><button className={metronome ? "active" : ""} onClick={() => setMetronome(!metronome)}>{metronome ? "Parar" : "Iniciar"}</button></div>
      </section>
      {rhythmVisible && <section className="panel rhythm-panel">
        <h3>O ritmo é chocável?</h3>
        <div className="rhythm-choice"><button className={shockable === "yes" ? "active" : ""} onClick={() => selectRhythm("yes")}>Sim · FV/TV sem pulso</button><button className={shockable === "no" ? "active" : ""} onClick={() => selectRhythm("no")}>Não · AESP/assistolia</button></div>
        {shockable === "yes" && <div className="guidance danger"><b>Desfibrilação</b><ol><li>Carregar conforme recomendação do fabricante; se desconhecida, usar a máxima disponível.</li><li>Confirmar que ninguém toca o paciente e anunciar “afasta”.</li><li>Aplicar o choque e retomar imediatamente a RCP por 2 minutos.</li></ol><button onClick={() => addEvent("Choque aplicado; RCP retomada")}>Registrar choque</button></div>}
        {shockable === "no" && <div className="guidance"><b>Ritmo não chocável</b><p>Retomar RCP por 2 minutos, administrar adrenalina assim que viável e tratar causas reversíveis.</p></div>}
        <div className="cpr-quality"><b>RCP de alta qualidade</b><span>100–120 compressões/min · profundidade de pelo menos 5 cm · retorno completo do tórax · mínima interrupção</span></div>
      </section>}
      <div className="finish-bar"><button onClick={() => finish()}>Finalizar procedimento e gerar relatório</button></div>
      <section className="panel event-log"><h3>Linha do tempo</h3>{events.length ? events.slice().reverse().map((event, index) => <div key={`${event.at}-${index}`}><time>{clock(event.at)}</time><span>{event.label}</span></div>) : <p>Nenhum evento registrado.</p>}</section>
    </div> : <section className="panel report-panel"><div className="section-heading"><span>04</span><div><h2>Relatório do procedimento</h2><p>Revise e complemente antes de registrar no prontuário.</p></div></div><textarea readOnly value={report}/><div className="report-actions"><button className="copy-button" onClick={copy}>Copiar relatório</button><label><span>DDD + número</span><input inputMode="tel" value={phone} onChange={event => setPhone(formatPhone(event.target.value))} placeholder="(00) 00000-0000" /></label><div className="share-buttons"><button className="share-button whatsapp-button" onClick={whatsapp}><FaWhatsapp aria-hidden="true"/> WhatsApp</button><button className="share-button telegram-button" onClick={telegram}><FaTelegramPlane aria-hidden="true"/> Telegram</button></div></div></section>}
    <p className="clinical-note">Baseado no algoritmo de PCR adulta AHA 2025. Use apenas por equipe treinada e siga o protocolo institucional e as instruções do fabricante do desfibrilador.</p>
  </div>;
}
