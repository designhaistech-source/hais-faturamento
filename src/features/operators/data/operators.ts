/** Operadora de saúde com a situação do contrato do hospital com ela. */
export interface Operator {
  id: string;
  name: string;
  hasContract: boolean;
  /** yyyy-MM-dd, vazio quando não há contrato. */
  validUntil: string;
  /** null quando não há contrato. */
  amendmentsCount: number | null;
}

export const operatorsQueryKey = ["operators"] as const;

// Dados sintéticos de protótipo; substituir pela fonte real quando definida.
const SAMPLE_OPERATORS: Operator[] = [
  { id: "amil", name: "Amil", hasContract: true, validUntil: "2026-12-31", amendmentsCount: 2 },
  { id: "caurn", name: "CAURN", hasContract: true, validUntil: "2027-06-30", amendmentsCount: 1 },
  { id: "hapvida", name: "Hapvida", hasContract: false, validUntil: "", amendmentsCount: null },
  { id: "unimed", name: "Unimed", hasContract: true, validUntil: "2026-12-31", amendmentsCount: 3 },
  { id: "sulamerica", name: "SulAmérica", hasContract: false, validUntil: "", amendmentsCount: null },
];

export async function listOperators(): Promise<Operator[]> {
  return SAMPLE_OPERATORS;
}
