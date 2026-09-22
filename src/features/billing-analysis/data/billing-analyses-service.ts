import { supabase } from "@/integrations/supabase/client";
import { listContractRules } from "@/features/contracts/data/contract-rules-service";

import { analyzeBilling, type AnalysisItemResult, type AnalysisTotals } from "./analysis-engine";
import { loadPricingBases } from "./pricing-lookup";
import { parseTissXml, readTissItems } from "./tiss-xml";
import {
  readAnalysisPartiesFromXmlDocument,
  type BillingAnalysis,
  type BillingAnalysisStatus,
} from "./billing-analyses";

export const billingAnalysesQueryKey = ["billing-analyses"] as const;

function toStatus(value: string | null): BillingAnalysisStatus {
  return value === "completed" || value === "failed" ? value : "processing";
}

export async function listBillingAnalyses(): Promise<BillingAnalysis[]> {
  const { data, error } = await supabase
    .from("billing_analyses")
    .select(
      "id, contract_id, contract_company, file_name, provider, health_plan, status, item_count, divergence_count, unanalyzed_count, error_message, analyzed_at",
    )
    .order("analyzed_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
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
  }));
}

interface CreateAnalysisRow {
  contractId: string;
  contractCompany: string;
  fileName: string;
  provider: string;
  healthPlan: string;
}

async function createAnalysisRow(input: CreateAnalysisRow): Promise<string> {
  const { data, error } = await supabase
    .from("billing_analyses")
    .insert({
      contract_id: input.contractId,
      contract_company: input.contractCompany,
      file_name: input.fileName,
      provider: input.provider,
      health_plan: input.healthPlan,
      status: "processing",
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Não foi possível registrar a análise.");
  return data.id;
}

async function saveItems(analysisId: string, items: AnalysisItemResult[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.from("billing_analysis_items").insert(
    items.map((item) => ({
      analysis_id: analysisId,
      line_number: item.lineNumber,
      code: item.code,
      description: item.description,
      quantity: item.quantity,
      unit_value: item.unitValue,
      total_value: item.totalValue,
      executed_at: item.executedAt ? item.executedAt : null,
      status: item.status,
      reason: item.reason,
      source: item.source,
      reference_value: item.referenceValue,
      rule_description: item.ruleDescription,
      expected_value: item.expectedValue,
      difference: item.difference,
    })),
  );
  if (error) throw error;
}

async function completeAnalysis(analysisId: string, totals: AnalysisTotals): Promise<void> {
  const { error } = await supabase
    .from("billing_analyses")
    .update({
      status: "completed",
      item_count: totals.itemCount,
      divergence_count: totals.divergenceCount,
      unanalyzed_count: totals.unanalyzedCount,
      billed_total: totals.billedTotal,
      expected_total: totals.expectedTotal,
      completed_at: new Date().toISOString(),
    })
    .eq("id", analysisId);
  if (error) throw error;
}

async function failAnalysis(analysisId: string, message: string): Promise<void> {
  await supabase
    .from("billing_analyses")
    .update({ status: "failed", error_message: message, completed_at: new Date().toISOString() })
    .eq("id", analysisId);
}

export interface RunBillingAnalysisInput {
  file: File;
  contractId: string;
  contractCompany: string;
}

/**
 * Executa a análise: lê o XML TISS, aplica as regras do contrato, consulta as
 * bases de precificação cadastradas e persiste o resultado item por item.
 */
export async function runBillingAnalysis(input: RunBillingAnalysisInput): Promise<string> {
  // A análise só roda com regras contratuais já revisadas e salvas.
  const contractRules = await listContractRules(input.contractId);
  if (contractRules.length === 0 || !contractRules.every((rule) => rule.reviewed)) {
    throw new Error("Este contrato ainda não possui regras de remuneração revisadas.");
  }

  const xml = await parseTissXml(input.file);
  const parties = readAnalysisPartiesFromXmlDocument(xml);
  const items = readTissItems(xml);

  const analysisId = await createAnalysisRow({
    contractId: input.contractId,
    contractCompany: input.contractCompany,
    fileName: input.file.name,
    provider: parties.provider,
    healthPlan: parties.healthPlan,
  });

  try {
    const [rules, bases] = await Promise.all([
      listContractRules(input.contractId),
      loadPricingBases(),
    ]);
    const result = analyzeBilling(items, rules, bases);
    await saveItems(analysisId, result.items);
    await completeAnalysis(analysisId, result.totals);
    return analysisId;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Não foi possível concluir a análise.";
    await failAnalysis(analysisId, message);
    throw cause;
  }
}

/** Ferramenta provisória de testes: apaga todas as análises realizadas. */
export async function deleteAllBillingAnalyses(): Promise<void> {
  const { data, error: listError } = await supabase.from("billing_analyses").select("id");
  if (listError) throw listError;
  const ids = (data ?? []).map((row) => row.id);
  if (ids.length === 0) return;
  const { error } = await supabase.from("billing_analyses").delete().in("id", ids);
  if (error) throw error;
}
