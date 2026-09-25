import { supabase } from "@/integrations/supabase/client";
import { listContractRules } from "@/features/contracts/data/contract-rules-service";

import { analyzeBilling, type AnalysisItemResult, type AnalysisTotals } from "./analysis-engine";
import { loadPricingBases } from "./pricing-lookup";
import { readTissItemsDetailed, type SkippedTissItem, type TissItem } from "./tiss-xml";
import {
  readAnalysisPartiesFromXmlDocument,
  UNIDENTIFIED_LABEL,
  type BillingAnalysis,
  type BillingAnalysisStatus,
  toProcessingDetails,
  toProcessingStatus,
  type ProcessingDetails,
  type ProcessingStatus,
} from "./billing-analyses";

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const billingAnalysesQueryKey = ["billing-analyses"] as const;

function toStatus(value: string | null): BillingAnalysisStatus {
  return value === "completed" || value === "failed" ? value : "processing";
}

export async function listBillingAnalyses(): Promise<BillingAnalysis[]> {
  const { data, error } = await supabase
    .from("billing_analyses")
    .select(
      "id, contract_id, contract_company, file_name, provider, health_plan, status, item_count, divergence_count, unanalyzed_count, error_message, analyzed_at, processing_status, processing_details",
    )
    .order("analyzed_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const status = toStatus(row.status);
    return {
      id: row.id,
      contractId: row.contract_id ?? "",
      contractCompany: row.contract_company ?? "",
      fileName: row.file_name,
      provider: row.provider ?? "",
      healthPlan: row.health_plan ?? "",
      analyzedAt: row.analyzed_at,
      status,
      itemCount: row.item_count,
      divergenceCount: row.divergence_count,
      unanalyzedCount: row.unanalyzed_count,
      errorMessage: row.error_message ?? null,
      processingStatus: toProcessingStatus(row.processing_status, status),
      processingDetails: toProcessingDetails(row.processing_details),
    };
  });
}

interface CreateAnalysisRow {
  contractId: string;
  contractCompany: string;
  fileName: string;
  provider: string;
  healthPlan: string;
  xmlContent: string;
  fileHash: string;
  status: BillingAnalysisStatus;
  processingStatus: ProcessingStatus;
  processingDetails?: ProcessingDetails;
  errorMessage?: string;
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
      xml_content: input.xmlContent,
      file_hash: input.fileHash,
      status: input.status,
      processing_status: input.processingStatus,
      processing_details: (input.processingDetails ?? null) as never,
      error_message: input.errorMessage ?? null,
      completed_at: input.status === "processing" ? null : new Date().toISOString(),
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
      reference_type: item.referenceType,
      factor: item.factor,
      adjustment_percent: item.adjustmentPercent,
      calculation: item.calculation,
      category: item.category,
    })),
  );
  if (error) throw error;
}

async function completeAnalysis(
  analysisId: string,
  totals: AnalysisTotals,
  processingStatus: ProcessingStatus,
  details: ProcessingDetails,
): Promise<void> {
  const { error } = await supabase
    .from("billing_analyses")
    .update({
      status: "completed",
      processing_status: processingStatus,
      processing_details: details as never,
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
    .update({
      status: "failed",
      processing_status: "PROCESSING_ERROR",
      processing_details: { technicalMessage: message } as never,
      error_message: message,
      completed_at: new Date().toISOString(),
    })
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
  // A análise só roda com dados já extraídos do contrato.
  const contractRules = await listContractRules(input.contractId);
  if (contractRules.length === 0) {
    throw new Error("Este contrato ainda não possui dados extraídos.");
  }

  const xmlContent = await input.file.text();
  const fileHash = await sha256(xmlContent);
  const base = {
    contractId: input.contractId,
    contractCompany: input.contractCompany,
    fileName: input.file.name,
    xmlContent,
    fileHash,
  };

  const parsed = new DOMParser().parseFromString(xmlContent, "application/xml");
  const parseError = parsed.getElementsByTagName("parsererror")[0];
  if (parseError) {
    await createAnalysisRow({
      ...base,
      provider: UNIDENTIFIED_LABEL,
      healthPlan: UNIDENTIFIED_LABEL,
      status: "failed",
      processingStatus: "INVALID_FILE",
      errorMessage: "O arquivo enviado não é um XML válido.",
      processingDetails: { technicalMessage: parseError.textContent?.trim() || undefined },
    });
    throw new Error("O arquivo enviado não é um XML válido.");
  }

  const parties = readAnalysisPartiesFromXmlDocument(parsed);
  const { items, skipped } = readTissItemsDetailed(parsed);

  if (items.length === 0) {
    await createAnalysisRow({
      ...base,
      ...parties,
      status: "failed",
      processingStatus: "INVALID_FILE",
      errorMessage: "Nenhum item faturado foi encontrado no arquivo.",
      processingDetails: skipped.length > 0 ? { skippedParts: skipped } : undefined,
    });
    throw new Error("Nenhum item faturado foi encontrado no arquivo.");
  }

  const { data: previous } = await supabase
    .from("billing_analyses")
    .select("id, analyzed_at")
    .eq("contract_id", input.contractId)
    .eq("file_hash", fileHash)
    .eq("status", "completed")
    .order("analyzed_at", { ascending: false })
    .limit(1);
  const duplicate = previous?.[0];
  if (duplicate) {
    await createAnalysisRow({
      ...base,
      ...parties,
      status: "failed",
      processingStatus: "DUPLICATE_FILE",
      errorMessage: "Este arquivo já foi analisado para este contrato.",
      processingDetails: { duplicateOf: { id: duplicate.id, analyzedAt: duplicate.analyzed_at } },
    });
    throw new Error("Este arquivo já foi analisado para este contrato.");
  }

  const analysisId = await createAnalysisRow({
    ...base,
    ...parties,
    status: "processing",
    processingStatus: "PROCESSING",
  });
  await processAnalysis(analysisId, input.contractId, items, skipped);
  return analysisId;
}

/**
 * Aplica regras e bases aos itens já extraídos e persiste o resultado.
 * Itens sem preço ou regra ficam "Não analisado" sem afetar o status técnico;
 * apenas trechos não suportados na extração tornam o processamento parcial.
 */
async function processAnalysis(
  analysisId: string,
  contractId: string,
  items: TissItem[],
  skipped: SkippedTissItem[],
): Promise<void> {
  try {
    const [rules, bases] = await Promise.all([listContractRules(contractId), loadPricingBases()]);
    const result = analyzeBilling(items, rules, bases);
    await saveItems(analysisId, result.items);
    await completeAnalysis(
      analysisId,
      result.totals,
      skipped.length > 0 ? "PARTIALLY_EXTRACTED" : "EXTRACTED",
      skipped.length > 0 ? { skippedParts: skipped } : {},
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Não foi possível concluir a análise.";
    await failAnalysis(analysisId, message);
    throw cause;
  }
}

async function setProcessingStatus(analysisId: string, status: ProcessingStatus): Promise<void> {
  const { error } = await supabase
    .from("billing_analyses")
    .update({
      status: "processing",
      processing_status: status,
      processing_details: null,
      error_message: null,
      completed_at: null,
    })
    .eq("id", analysisId);
  if (error) throw error;
}

/** Reprocessa uma análise com falha usando o XML já armazenado: volta para a fila e processa. */
export async function reprocessBillingAnalysis(analysisId: string): Promise<string> {
  const { data, error } = await supabase
    .from("billing_analyses")
    .select("xml_content, contract_id")
    .eq("id", analysisId)
    .single();
  if (error) throw error;
  if (!data?.xml_content || !data.contract_id) {
    throw new Error("O arquivo original desta análise não está disponível para reprocessamento.");
  }

  const { error: deleteError } = await supabase
    .from("billing_analysis_items")
    .delete()
    .eq("analysis_id", analysisId);
  if (deleteError) throw deleteError;
  await setProcessingStatus(analysisId, "PENDING");

  const parsed = new DOMParser().parseFromString(data.xml_content, "application/xml");
  const { items, skipped } = readTissItemsDetailed(parsed);
  if (items.length === 0) {
    await failAnalysis(analysisId, "Nenhum item faturado foi encontrado no arquivo.");
    throw new Error("Nenhum item faturado foi encontrado no arquivo.");
  }
  await setProcessingStatus(analysisId, "PROCESSING");
  await processAnalysis(analysisId, data.contract_id, items, skipped);
  return analysisId;
}

/**
 * Ferramenta provisória de testes: cria uma análise com falha interna simulada
 * (tentativas esgotadas) a partir de um XML válido já enviado, sem depender de arquivo inválido.
 */
export async function simulateProcessingError(): Promise<void> {
  const { data, error } = await supabase
    .from("billing_analyses")
    .select("contract_id, contract_company, file_name, provider, health_plan, xml_content")
    .not("xml_content", "is", null)
    .not("contract_id", "is", null)
    .order("analyzed_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const source = data?.[0];
  if (!source?.xml_content || !source.contract_id) {
    throw new Error("Faça ao menos uma análise antes de simular a falha.");
  }
  // Marcador torna o hash único para que o reprocessamento não seja tratado como duplicado.
  const xmlContent = `${source.xml_content}\n<!-- simulacao-falha ${crypto.randomUUID()} -->`;
  const message = "Falha interna simulada: tentativas de processamento esgotadas (3 de 3).";
  await createAnalysisRow({
    contractId: source.contract_id,
    contractCompany: source.contract_company ?? "",
    fileName: source.file_name,
    provider: source.provider ?? UNIDENTIFIED_LABEL,
    healthPlan: source.health_plan ?? UNIDENTIFIED_LABEL,
    xmlContent,
    fileHash: await sha256(xmlContent),
    status: "failed",
    processingStatus: "PROCESSING_ERROR",
    processingDetails: { technicalMessage: message, simulated: true },
    errorMessage: message,
  });
}

/** XML original persistido de uma análise; null quando a análise é anterior ao armazenamento. */
export async function getAnalysisXml(analysisId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("billing_analyses")
    .select("xml_content")
    .eq("id", analysisId)
    .single();
  if (error) throw error;
  return data?.xml_content ?? null;
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

export interface AnalysisOutcomeCounts {
  divergenceCount: number;
  unanalyzedCount: number;
}

/** Contagens persistidas de uma análise concluída, usadas no aviso de conclusão. */
export async function getAnalysisOutcomeCounts(analysisId: string): Promise<AnalysisOutcomeCounts> {
  const { data, error } = await supabase
    .from("billing_analyses")
    .select("divergence_count, unanalyzed_count")
    .eq("id", analysisId)
    .single();
  if (error) throw error;
  return {
    divergenceCount: data?.divergence_count ?? 0,
    unanalyzedCount: data?.unanalyzed_count ?? 0,
  };
}
