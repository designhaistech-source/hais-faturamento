/** Operadora de saúde com a situação do contrato do hospital com ela. */
export interface Operator {
  id: string;
  name: string;
  hasContract: boolean;
  /** yyyy-MM-dd, vazio quando não há contrato. */
  validUntil: string;
  /** null quando não há contrato. */
  amendmentsCount: number | null;
  /** Contrato cadastrado que sustenta a página da operadora; null quando ainda não há. */
  contractId: string | null;
}

export const operatorsQueryKey = ["operators"] as const;

// Dados sintéticos de protótipo; substituir pela fonte real quando definida.
const SAMPLE_OPERATORS: Operator[] = [
  {
    id: "amil",
    name: "Amil",
    hasContract: true,
    validUntil: "2026-12-31",
    amendmentsCount: 2,
    contractId: null,
  },
  {
    id: "caurn",
    name: "CAURN",
    hasContract: true,
    validUntil: "2027-06-30",
    amendmentsCount: 1,
    contractId: null,
  },
  {
    id: "hapvida",
    name: "Hapvida",
    hasContract: false,
    validUntil: "",
    amendmentsCount: null,
    contractId: null,
  },
  {
    id: "unimed",
    name: "Unimed",
    hasContract: true,
    validUntil: "2026-12-31",
    amendmentsCount: 3,
    // Contrato de exemplo já cadastrado, com dados extraídos e aditivos.
    contractId: "a7d05376-3874-45e9-a848-c605137124c5",
  },
  {
    id: "sulamerica",
    name: "SulAmérica",
    hasContract: false,
    validUntil: "",
    amendmentsCount: null,
    contractId: null,
  },
];

export async function listOperators(): Promise<Operator[]> {
  return SAMPLE_OPERATORS;
}

export async function getOperator(id: string): Promise<Operator | null> {
  return SAMPLE_OPERATORS.find((operator) => operator.id === id) ?? null;
}

/**
 * Contrato que sustenta a página da operadora: o vínculo de exemplo ou, quando não há,
 * o contrato mais recente cadastrado com o nome da operadora.
 */
export function resolveOperatorContractId(
  operator: Operator,
  contracts: ReadonlyArray<{ id: string; company: string; createdAt?: string }>,
): string | null {
  if (operator.contractId) return operator.contractId;
  const matches = contracts
    .filter((contract) => contract.company === operator.name)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return matches[0]?.id ?? null;
}
