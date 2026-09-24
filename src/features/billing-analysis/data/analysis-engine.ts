/** Cálculo da análise: compara o valor faturado no XML com o valor esperado pelo contrato. */

import {
  contractRuleBaseLabel,
  describeContractRule,
  matchRuleForItem,
  type ContractRule,
} from "@/features/contracts/data/contract-rules";
import type { PricingBaseType } from "@/features/pricing-base/data/pricing-versions";

import { normalizeCode, type PricingBaseLookup } from "./pricing-lookup";
import type { TissItem } from "./tiss-xml";

/** "ok" = Match, "divergent" = Divergência, "unanalyzed" = Não analisado. */
export type AnalysisItemStatus = "ok" | "divergent" | "unanalyzed";

export interface AnalysisItemResult {
  lineNumber: number;
  code: string;
  description: string;
  quantity: number;
  unitValue: number | null;
  totalValue: number | null;
  executedAt: string;
  status: AnalysisItemStatus;
  /** Motivo quando o item não pôde ser analisado. */
  reason: string | null;
  /** Fonte usada no cálculo (base de precificação e arquivo, ou valor do contrato). */
  source: string;
  /** Referência da regra: brasindice, simpro, cbhpm ou contract. */
  referenceType: string | null;
  /** Valor unitário encontrado na base ou negociado no contrato. */
  referenceValue: number | null;
  factor: number | null;
  adjustmentPercent: number | null;
  /** Memória do cálculo em texto legível. */
  calculation: string | null;
  ruleDescription: string | null;
  expectedValue: number | null;
  /** Faturado − esperado: positivo quando faturado acima do esperado. */
  difference: number | null;
}

export interface AnalysisTotals {
  itemCount: number;
  divergenceCount: number;
  unanalyzedCount: number;
  billedTotal: number;
  expectedTotal: number;
}

export interface AnalysisResult {
  items: AnalysisItemResult[];
  totals: AnalysisTotals;
}

/** Diferenças abaixo de um centavo são consideradas iguais. */
const TOLERANCE = 0.005;

const PRICING_BASES: readonly PricingBaseType[] = ["brasindice", "simpro", "cbhpm"];

function isPricingBase(value: string): value is PricingBaseType {
  return (PRICING_BASES as readonly string[]).includes(value);
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function baseResult(item: TissItem): AnalysisItemResult {
  return {
    lineNumber: item.lineNumber,
    code: item.code,
    description: item.description,
    quantity: item.quantity,
    unitValue: item.unitValue,
    totalValue: item.totalValue,
    executedAt: item.executedAt,
    status: "unanalyzed",
    reason: null,
    source: "",
    referenceType: null,
    referenceValue: null,
    factor: null,
    adjustmentPercent: null,
    calculation: null,
    ruleDescription: null,
    expectedValue: null,
    difference: null,
  };
}

function unanalyzed(item: TissItem, reason: string, rule?: ContractRule): AnalysisItemResult {
  return {
    ...baseResult(item),
    reason,
    referenceType: rule?.baseType ?? null,
    ruleDescription: rule ? describeContractRule(rule) : null,
  };
}

/**
 * Sem código nem categoria compatível, usa a regra por base somente quando o
 * código do item existe em exatamente uma das bases exigidas pelas regras.
 */
function ruleByBaseLookup(
  rules: ContractRule[],
  item: TissItem,
  bases: Map<PricingBaseType, PricingBaseLookup>,
): ContractRule | null {
  if (item.code.trim() === "") return null;
  const code = normalizeCode(item.code);
  const candidates = rules.filter((rule) => {
    if (rule.codes.trim() !== "" || !isPricingBase(rule.baseType)) return false;
    if (item.executedAt && rule.validFrom && item.executedAt < rule.validFrom) return false;
    if (item.executedAt && rule.validTo && item.executedAt > rule.validTo) return false;
    return bases.get(rule.baseType)?.values.has(code) ?? false;
  });
  return candidates.length === 1 ? candidates[0] : null;
}

function analyzeItem(
  item: TissItem,
  rules: ContractRule[],
  bases: Map<PricingBaseType, PricingBaseLookup>,
): AnalysisItemResult {
  const match = matchRuleForItem(rules, item);
  let rule: ContractRule | null = match.kind === "matched" ? match.rule : null;
  if (!rule) rule = ruleByBaseLookup(rules, item, bases);
  if (!rule) {
    return match.kind === "out_of_validity"
      ? unanalyzed(item, "Regra fora da vigência na data de execução do item.", match.rule)
      : unanalyzed(item, "Regra contratual não identificada.");
  }

  let referenceValue: number;
  let source: string;
  let referenceLabel: string;

  if (rule.baseType === "contract") {
    if (rule.negotiatedValue === null) {
      return unanalyzed(item, "Valor negociado não informado na regra do contrato.", rule);
    }
    referenceValue = rule.negotiatedValue;
    source = "Valor negociado no contrato";
    referenceLabel = "valor negociado";
  } else if (isPricingBase(rule.baseType)) {
    const label = contractRuleBaseLabel(rule.baseType);
    const base = bases.get(rule.baseType);
    if (!base) {
      return unanalyzed(item, `Base de precificação necessária não disponível: ${label}.`, rule);
    }
    if (item.code.trim() === "") {
      return unanalyzed(item, "Informações insuficientes para o cálculo: item sem código.", rule);
    }
    const value = base.values.get(normalizeCode(item.code));
    if (value === undefined) {
      return unanalyzed(item, `Código não encontrado na base ${label}.`, rule);
    }
    referenceValue = value;
    source = `${label} · ${base.version.file.name}`;
    referenceLabel = label;
  } else {
    return unanalyzed(item, "Regra contratual sem referência de cálculo definida.", rule);
  }

  if (item.totalValue === null) {
    return unanalyzed(
      item,
      "Informações insuficientes para o cálculo: item sem valor faturado.",
      rule,
    );
  }

  /** Valor negociado já é o valor final; fator e ajuste só se aplicam às bases. */
  const isNegotiated = rule.baseType === "contract";
  const factor = isNegotiated ? 1 : rule.factor;
  const adjustment = isNegotiated ? 0 : rule.adjustmentPercent;
  const unitExpected = referenceValue * factor * (1 + adjustment / 100);
  const expectedValue = roundCents(unitExpected * item.quantity);
  const billed = roundCents(item.totalValue);
  const difference = roundCents(billed - expectedValue);

  const steps = [`${referenceLabel} ${formatNumber(referenceValue)}`];
  if (factor !== 1) steps.push(`× fator ${formatNumber(factor)}`);
  if (adjustment !== 0) {
    steps.push(`× (1 ${adjustment < 0 ? "−" : "+"} ${formatNumber(Math.abs(adjustment))}%)`);
  }
  steps.push(`× quantidade ${formatNumber(item.quantity)}`);
  const calculation = `${steps.join(" ")} = ${formatNumber(expectedValue)}`;

  return {
    ...baseResult(item),
    totalValue: billed,
    status: Math.abs(difference) > TOLERANCE ? "divergent" : "ok",
    source,
    referenceType: rule.baseType,
    referenceValue,
    factor,
    adjustmentPercent: adjustment,
    calculation,
    ruleDescription: describeContractRule(rule),
    expectedValue,
    difference,
  };
}

/** Roda a análise de um arquivo TISS com as regras do contrato e as bases cadastradas. */
export function analyzeBilling(
  items: TissItem[],
  rules: ContractRule[],
  bases: Map<PricingBaseType, PricingBaseLookup>,
): AnalysisResult {
  const results = items.map((item) => analyzeItem(item, rules, bases));

  const totals: AnalysisTotals = {
    itemCount: results.length,
    divergenceCount: results.filter((item) => item.status === "divergent").length,
    unanalyzedCount: results.filter((item) => item.status === "unanalyzed").length,
    billedTotal: roundCents(results.reduce((sum, item) => sum + (item.totalValue ?? 0), 0)),
    expectedTotal: roundCents(results.reduce((sum, item) => sum + (item.expectedValue ?? 0), 0)),
  };

  return { items: results, totals };
}
