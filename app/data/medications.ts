export type Dilution = {
  id: string;
  label: string;
  drugVolume: number;
  diluentVolume: number;
  drugConcentration: number;
};

export type Medication = {
  id: string;
  name: string;
  amountUnit: "mg" | "U";
  doseUnit: "mcg/kg/min" | "mcg/kg/h" | "mg/kg/h" | "mcg/min" | "U/min";
  min?: number;
  max?: number;
  reference: string;
  dilutions: Dilution[];
};

const dilution = (id: string, label: string, drugVolume: number, diluentVolume: number, drugConcentration: number): Dilution =>
  ({ id, label, drugVolume, diluentVolume, drugConcentration });

export const medications: Medication[] = [
  {
    id: "fentanyl", name: "Fentanil", amountUnit: "mg", doseUnit: "mcg/kg/h", min: 0.5, max: 10,
    reference: "Faixa adulta de infusão contínua; titular conforme resposta.",
    dilutions: [
      dilution("pure", "Fentanil puro", 20, 0, 0.05),
      dilution("100ml", "Fentanil 20 mL + SF 0,9% 80 mL", 20, 80, 0.05),
    ],
  },
  {
    id: "midazolam", name: "Midazolam", amountUnit: "mg", doseUnit: "mg/kg/h", min: 0.02, max: 0.1,
    reference: "Sedação contínua em adulto; pode variar conforme indicação.",
    dilutions: [
      dilution("pure", "Midazolam puro", 10, 0, 5),
      dilution("4amp", "Midazolam 4 ampolas (50 mg) + SF 0,9% 160 mL", 40, 160, 5),
    ],
  },
  { id: "morphine", name: "Morfina", amountUnit: "mg", doseUnit: "mg/kg/h", min: 0.01, max: 0.1, reference: "Referência de infusão contínua; titular e monitorar.", dilutions: [dilution("standard", "Morfina 50 mg em 50 mL", 5, 45, 10)] },
  {
    id: "norepinephrine", name: "Norepinefrina", amountUnit: "mg", doseUnit: "mcg/kg/min", min: 0.05, max: 1,
    reference: "Referência hemodinâmica usual; não representa limite absoluto.",
    dilutions: [
      dilution("1amp100", "1 ampola + SF 0,9% 96 mL", 4, 96, 1),
      dilution("2amp100", "2 ampolas + SF 0,9% 92 mL", 8, 92, 1),
      dilution("4amp250", "4 ampolas + SF 0,9% 234 mL", 16, 234, 1),
      dilution("8amp250", "8 ampolas + SF 0,9% 218 mL", 32, 218, 1),
    ],
  },
  {
    id: "dobutamine", name: "Dobutamina", amountUnit: "mg", doseUnit: "mcg/kg/min", min: 2.5, max: 20,
    reference: "Faixa de bula para suporte inotrópico.",
    dilutions: [
      dilution("1amp", "1 ampola — volume total 250 mL", 20, 230, 12.5),
      dilution("2amp", "2 ampolas — volume total 250 mL", 40, 210, 12.5),
      dilution("4amp", "4 ampolas — volume total 250 mL", 80, 170, 12.5),
    ],
  },
  { id: "dopamine", name: "Dopamina", amountUnit: "mg", doseUnit: "mcg/kg/min", min: 2, max: 20, reference: "Faixa de infusão titulada conforme resposta.", dilutions: [dilution("standard", "Dopamina 400 mg em 250 mL", 40, 210, 10)] },
  { id: "nitroglycerin", name: "Nitroglicerina", amountUnit: "mg", doseUnit: "mcg/min", min: 5, max: 200, reference: "Faixa adulta habitual; titular conforme resposta clínica.", dilutions: [dilution("standard", "Nitroglicerina 50 mg em 250 mL", 10, 240, 5)] },
  { id: "nitroprusside", name: "Nitroprussiato", amountUnit: "mg", doseUnit: "mcg/kg/min", min: 0.3, max: 10, reference: "10 mcg/kg/min é limite de curta duração em bula.", dilutions: [dilution("standard", "Nitroprussiato 50 mg em 250 mL", 2, 248, 25)] },
  { id: "epinephrine", name: "Adrenalina", amountUnit: "mg", doseUnit: "mcg/kg/min", min: 0.05, max: 2, reference: "Hipotensão no choque séptico em adulto, conforme bula.", dilutions: [dilution("standard", "Adrenalina 4 mg em 250 mL", 4, 246, 1)] },
  { id: "vasopressin", name: "Vasopressina", amountUnit: "U", doseUnit: "U/min", min: 0.01, max: 0.07, reference: "Choque vasodilatador em adulto, conforme bula.", dilutions: [dilution("standard", "Vasopressina 20 U em 100 mL", 1, 99, 20)] },
];
