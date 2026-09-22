/** Cálculo da análise: compara o valor faturado no XML com o valor esperado pelo contrato. */

import {
  contractRuleBaseLabel,
  describeContractRule,
  findRuleForItem,
  type ContractRule,
} from "@/features/contracts/data/contract-rules";
import type { PricingBaseType } from "@/features/pricing-base/data/pricing-versions";

import { normalizeCode, type PricingBaseLookup } from "./pricing-lookup";
import type { TissItem } from "./tiss-xml";

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
  /** Fonte usada no cálculo (base de precificação ou valor do contrato). */
  source: string;
  referenceValue: number | null;
  ruleDescription: string | null;
  expectedValue: number | null;
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
const TOLERANCE = 0.01;

const PRICING_BASES: readonly PricingBaseType[] = ["brasindice", "simpro", "cbhpm"];

function isPricingBase(value: string): value is PricingBaseType {
  return (PRICING_BASES as readonly string[]).includes(value);
}

function unanalyzed(item: TissItem, reason: string): AnalysisItemResult {
  return {
    lineNumber: item.lineNumber,
    code: item.code,
    description: item.description,
    quantity: item.quantity,
    unitValue: item.unitValue,
    totalValue: item.totalValue,
    executedAt: item.executedAt,
    status: "unanalyzed",
    reason,
    source: "",
    referenceValue: null,
    ruleDescription: null,
    expectedValue: null,
    difference: null,
  };
}

function applyRule(rule: ContractRule, referenceValue: number): number {
  return referenceValue * rule.factor * (1 + rule.adjustmentPercent / 100);
}

/** Roda a análise de um arquivo TISS com as regras do contrato e as bases cadastradas. */
export function analyzeBilling(
  items: TissItem[],
  rules: ContractRule[],
  bases: Map<PricingBaseType, PricingBaseLookup>,
): AnalysisResult {
  const results = items.map<AnalysisItemResult>((item) => {
    const rule = findRuleForItem(rules, item);
    if (!rule) return unanalyzed(item, "Regra contratual não identificada.");

    let referenceValue: number | null = null;
    let source = "";

    if (rule.baseType === "contract") {
      if (rule.negotiatedValue === null) {
        return unanalyzed(item, "Valor negociado não informado na regra do contrato.");
      }
      referenceValue = rule.negotiatedValue;
      source = "Valor negociado no contrato";
    } else if (isPricingBase(rule.baseType)) {
      const base = bases.get(rule.baseType);
      if (!base) {
        return unanalyzed(
          item,
          `Base de precificação não cadastrada: ${contractRuleBaseLabel(rule.baseType)}.`,
        );
      }
      if (item.code.trim() === "") {
        return unanalyzed(item, "Informação insuficiente para o cálculo: item sem código.");
      }
      const value = base.values.get(normalizeCode(item.code));
      if (value === undefined) {
        return unanalyzed(
          item,
          `Código não encontrado na base ${contractRuleBaseLabel(rule.baseType)}.`,
        );
      }
      referenceValue = value;
      source = `${contractRuleBaseLabel(rule.baseType)} · ${base.version.file.name}`;
    } else {
      return unanalyzed(item, "Regra contratual sem base de precificação definida.");
    }

    const billedTotal =
      item.totalValue ?? (item.unitValue !== null ? item.unitValue * item.quantity : null);
    if (billedTotal === null) {
      return unanalyzed(item, "Informação insuficiente para o cálculo: item sem valor faturado.");
    }

    const expectedValue = applyRule(rule, referenceValue) * item.quantity;
    const difference = billedTotal - expectedValue;

    return {
      lineNumber: item.lineNumber,
      code: item.code,
      description: item.description,
      quantity: item.quantity,
      unitValue: item.unitValue,
      totalValue: billedTotal,
      executedAt: item.executedAt,
      status: Math.abs(difference) > TOLERANCE ? "divergent" : "ok",
      reason: null,
      source,
      referenceValue,
      ruleDescription: describeContractRule(rule),
      expectedValue,
      difference,
    };
  });

  const totals: AnalysisTotals = {
    itemCount: results.length,
    divergenceCount: results.filter((item) => item.status === "divergent").length,
    unanalyzedCount: results.filter((item) => item.status === "unanalyzed").length,
    billedTotal: results.reduce((sum, item) => sum + (item.totalValue ?? 0), 0),
    expectedTotal: results.reduce((sum, item) => sum + (item.expectedValue ?? 0), 0),
  };

  return { items: results, totals };
}
