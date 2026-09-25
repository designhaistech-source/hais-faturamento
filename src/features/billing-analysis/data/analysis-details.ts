import { supabase } from "@/integrations/supabase/client";

import {
  toProcessingDetails,
  toProcessingStatus,
  type BillingAnalysis,
  type BillingAnalysisStatus,
} from "./billing-analyses";

export type AnalysisItemStatus = "ok" | "divergent" | "unanalyzed";

export interface AnalysisItemDetail {
  id: string;
  lineNumber: number;
  code: string;
  description: string;
  category: string;
  quantity: number;
  billedValue: number | null;
  status: AnalysisItemStatus;
  reason: string | null;
  source: string;
  referenceType: string | null;
  referenceValue: number | null;
  ruleDescription: string | null;
  factor: number | null;
  adjustmentPercent: number | null;
  calculation: string | null;
  expectedValue: number | null;
  difference: number | null;
}

export interface AnalysisSummary {
  total: number;
  matches: number;
  divergences: number;
  unanalyzed: number;
}

export const analysisDetailsQueryKey = (id: string) => ["billing-analysis", id] as const;

function toStatus(value: string | null): BillingAnalysisStatus {
  return value === "completed" || value === "failed" ? value : "processing";
}

function toItemStatus(value: string): AnalysisItemStatus {
  return value === "ok" || value === "divergent" ? value : "unanalyzed";
}

export async function getAnalysisDetails(
  id: string,
): Promise<{ analysis: BillingAnalysis; items: AnalysisItemDetail[] } | null> {
  const [analysisResult, itemsResult] = await Promise.all([
    supabase.from("billing_analyses").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("billing_analysis_items")
      .select("*")
      .eq("analysis_id", id)
      .order("line_number", { ascending: true }),
  ]);
  if (analysisResult.error) throw analysisResult.error;
  if (itemsResult.error) throw itemsResult.error;
  const row = analysisResult.data;
  if (!row) return null;

  return {
    analysis: {
      id: row.id,
      contractId: row.contract_id ?? "",
      contractCompany: row.contract_company ?? "",
      fileName: row.file_name,
      provider: row.provider ?? "",
      healthPlan: row.health_plan ?? "",
      analyzedAt: row.analyzed_at,
      status: toStatus(row.status),
      itemCount: row.item_count,
      divergenceCount: row.divergence_count,
      unanalyzedCount: row.unanalyzed_count,
      errorMessage: row.error_message ?? null,
      processingStatus: toProcessingStatus(row.processing_status, toStatus(row.status)),
      processingDetails: toProcessingDetails(row.processing_details),
    },
    items: (itemsResult.data ?? []).map((item) => ({
      id: item.id,
      lineNumber: item.line_number,
      code: item.code,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      billedValue: item.total_value,
      status: toItemStatus(item.status),
      reason: item.reason,
      source: item.source,
      referenceType: item.reference_type,
      referenceValue: item.reference_value,
      ruleDescription: item.rule_description,
      factor: item.factor,
      adjustmentPercent: item.adjustment_percent,
      calculation: item.calculation,
      expectedValue: item.expected_value,
      difference: item.difference,
    })),
  };
}

/** Totais calculados a partir dos itens persistidos, não dos contadores da análise. */
export function summarizeItems(items: AnalysisItemDetail[]): AnalysisSummary {
  return items.reduce<AnalysisSummary>(
    (acc, item) => ({
      total: acc.total + 1,
      matches: acc.matches + (item.status === "ok" ? 1 : 0),
      divergences: acc.divergences + (item.status === "divergent" ? 1 : 0),
      unanalyzed: acc.unanalyzed + (item.status === "unanalyzed" ? 1 : 0),
    }),
    { total: 0, matches: 0, divergences: 0, unanalyzed: 0 },
  );
}

export const ITEM_STATUS_LABEL: Record<AnalysisItemStatus, string> = {
  ok: "Conforme",
  divergent: "Divergência",
  unanalyzed: "Não analisado",
};

export const ITEM_STATUS_BADGE: Record<
  AnalysisItemStatus,
  "success-soft" | "destructive-soft" | "warning-soft"
> = {
  ok: "success-soft",
  divergent: "destructive-soft",
  unanalyzed: "warning-soft",
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

export function formatCurrency(value: number | null): string {
  return value === null ? "—" : currency.format(value);
}

/** Diferença sempre com sinal explícito (faturado − esperado). */
export function formatDifference(value: number | null): string {
  if (value === null) return "—";
  const formatted = currency.format(Math.abs(value));
  if (Math.abs(value) < 0.005) return currency.format(0);
  return value > 0 ? `+${formatted}` : `−${formatted}`;
}

export function formatDecimal(value: number | null): string {
  return value === null ? "—" : decimal.format(value);
}

export function formatAdjustment(value: number | null): string {
  if (value === null || value === 0) return value === 0 ? "Sem ajuste" : "—";
  const pct = `${decimal.format(Math.abs(value))}%`;
  return value < 0 ? `Desconto de ${pct}` : `Acréscimo de ${pct}`;
}

const REFERENCE_LABEL: Record<string, string> = {
  brasindice: "Brasíndice",
  simpro: "SIMPRO",
  cbhpm: "CBHPM",
  contract: "Valor negociado no contrato",
  none: "Sem referência",
};

export function referenceLabel(item: AnalysisItemDetail): string {
  if (item.referenceType) return REFERENCE_LABEL[item.referenceType] ?? item.referenceType;
  return item.source || "—";
}

function capitalize(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed.charAt(0).toLocaleUpperCase("pt-BR") + trimmed.slice(1) : "";
}

/** Categoria lida no XML, com capitalização para exibição. */
export function categoryLabel(category: string): string {
  return capitalize(category) || "—";
}

/**
 * Nome da regra aplicada: a categoria da regra quando existe; caso contrário, a
 * descrição salva (ex.: valor negociado), já que referência e ajuste têm linhas próprias.
 */
export function appliedRuleLabel(ruleDescription: string | null): string {
  if (!ruleDescription) return "—";
  const category = ruleDescription.split(" · ").find((part) => part.startsWith("categoria "));
  if (category) return capitalize(category.slice("categoria ".length));
  if (ruleDescription.startsWith("Valor negociado")) return ruleDescription;
  return "Regra geral do contrato";
}
