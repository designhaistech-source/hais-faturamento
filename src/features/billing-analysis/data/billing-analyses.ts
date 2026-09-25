/** Análises de faturamento realizadas a partir de arquivos XML TISS. */

export type BillingAnalysisStatus = "processing" | "completed" | "failed";

/** Processamento técnico do arquivo, independente do resultado da análise. */
export type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "EXTRACTED"
  | "PARTIALLY_EXTRACTED"
  | "INVALID_FILE"
  | "PROCESSING_ERROR"
  | "DUPLICATE_FILE";

export const PROCESSING_STATUS_LABEL: Record<ProcessingStatus, string> = {
  PENDING: "Na fila",
  PROCESSING: "Processando",
  EXTRACTED: "Concluído",
  PARTIALLY_EXTRACTED: "Concluído parcialmente",
  INVALID_FILE: "Arquivo inválido",
  PROCESSING_ERROR: "Falha no processamento",
  DUPLICATE_FILE: "Arquivo duplicado",
};

/** Informações complementares do processamento, exibidas no modal de detalhes. */
export interface ProcessingDetails {
  /** Trechos do arquivo que não puderam ser lidos (processamento parcial). */
  skippedParts?: { position: number; tag: string }[];
  /** Mensagem técnica original, exibida de forma secundária. */
  technicalMessage?: string;
  /** Análise anterior com o mesmo arquivo (duplicidade). */
  duplicateOf?: { id: string; analyzedAt: string };
  /** Cenário provisório de teste de falha interna. */
  simulated?: boolean;
}

const PROCESSING_STATUSES: readonly ProcessingStatus[] = [
  "PENDING",
  "PROCESSING",
  "EXTRACTED",
  "PARTIALLY_EXTRACTED",
  "INVALID_FILE",
  "PROCESSING_ERROR",
  "DUPLICATE_FILE",
];

/** Registros anteriores à coluna derivam o status técnico do estado da análise. */
export function toProcessingStatus(
  value: string | null,
  status: BillingAnalysisStatus,
): ProcessingStatus {
  const known = PROCESSING_STATUSES.find((candidate) => candidate === value);
  if (known) return known;
  if (status === "completed") return "EXTRACTED";
  if (status === "failed") return "PROCESSING_ERROR";
  return "PROCESSING";
}

export function toProcessingDetails(value: unknown): ProcessingDetails {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ProcessingDetails)
    : {};
}

export function hasProcessingIssue(status: ProcessingStatus): boolean {
  return (
    status === "PARTIALLY_EXTRACTED" ||
    status === "INVALID_FILE" ||
    status === "PROCESSING_ERROR" ||
    status === "DUPLICATE_FILE"
  );
}

/** Há resultado de análise válido para consulta. */
export function hasAnalysisResult(analysis: BillingAnalysis): boolean {
  return (
    analysis.status === "completed" &&
    (analysis.processingStatus === "EXTRACTED" ||
      analysis.processingStatus === "PARTIALLY_EXTRACTED")
  );
}

export interface BillingAnalysis {
  id: string;
  /** Contrato usado na análise. */
  contractId: string;
  contractCompany: string;
  /** Nome do arquivo XML enviado. */
  fileName: string;
  /** Prestador identificado no XML TISS. */
  provider: string;
  /** Operadora identificada no XML TISS. */
  healthPlan: string;
  /** ISO timestamp do momento da análise. */
  analyzedAt: string;
  status: BillingAnalysisStatus;
  /** Itens faturados lidos no XML. */
  itemCount: number;
  /** Itens com diferença entre o valor faturado e o valor esperado. */
  divergenceCount: number;
  /** Itens sem regra, sem base ou sem informação suficiente para o cálculo. */
  unanalyzedCount: number;
  /** Motivo quando o processamento falhou. */
  errorMessage: string | null;
  processingStatus: ProcessingStatus;
  processingDetails: ProcessingDetails;
}

/** Texto exibido quando o XML não informa o dado. */
export const UNIDENTIFIED_LABEL = "Não identificado";

/** Formata um ISO timestamp como "dd/mm/aaaa, hh:mm" no fuso local. */
export function formatAnalysisDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function firstTagValue(document: Document, tagNames: readonly string[]): string | null {
  for (const tagName of tagNames) {
    const elements = Array.from(document.getElementsByTagName("*")).filter(
      (element) => element.localName === tagName,
    );
    for (const element of elements) {
      const value = element.textContent?.trim();
      if (value) return value;
    }
  }
  return null;
}

export const PROVIDER_TAGS = ["nomeContratado", "nomePrestador", "razaoSocial"] as const;
export const PROVIDER_CNPJ_TAGS = [
  "cnpjContratado",
  "CNPJ",
  "cnpj",
  "codigoPrestadorNaOperadora",
] as const;
export const HEALTH_PLAN_TAGS = ["nomeOperadora", "razaoSocialOperadora"] as const;
export const HEALTH_PLAN_ANS_TAGS = ["registroANS", "numeroRegistroANS"] as const;

/** Formata 14 dígitos como CNPJ (00.000.000/0000-00); retorna null se não houver 14 dígitos. */
export function formatCnpj(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return null;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/** Extrai prestador e operadora de um XML TISS já analisado. */
export function readAnalysisPartiesFromXmlDocument(parsed: Document): {
  provider: string;
  healthPlan: string;
} {
  const providerName = firstTagValue(parsed, PROVIDER_TAGS);
  const providerCnpj = firstTagValue(parsed, PROVIDER_CNPJ_TAGS);
  const provider =
    providerName ?? (providerCnpj ? formatCnpj(providerCnpj) : null) ?? UNIDENTIFIED_LABEL;

  const healthPlanName = firstTagValue(parsed, HEALTH_PLAN_TAGS);
  const ansCode = firstTagValue(parsed, HEALTH_PLAN_ANS_TAGS)?.replace(/\D/g, "");
  const healthPlan = healthPlanName ?? (ansCode ? `ANS ${ansCode}` : null) ?? UNIDENTIFIED_LABEL;

  return { provider, healthPlan };
}

/** Extrai prestador e operadora de um XML TISS enviado pelo usuário. */
export async function readAnalysisPartiesFromXml(file: File): Promise<{
  provider: string;
  healthPlan: string;
}> {
  try {
    const text = await file.text();
    const parsed = new DOMParser().parseFromString(text, "application/xml");
    if (parsed.getElementsByTagName("parsererror").length > 0) {
      return { provider: UNIDENTIFIED_LABEL, healthPlan: UNIDENTIFIED_LABEL };
    }
    return readAnalysisPartiesFromXmlDocument(parsed);
  } catch {
    return { provider: UNIDENTIFIED_LABEL, healthPlan: UNIDENTIFIED_LABEL };
  }
}

/** Rótulo do resultado da análise para exibição no badge de status. */
export function analysisResultLabel(analysis: BillingAnalysis): string {
  if (analysis.status === "processing") return "Processando";
  if (analysis.status === "failed") return "Não concluída";

  const divergences = analysis.divergenceCount;
  const unanalyzed = analysis.unanalyzedCount;
  const divergenceLabel = `${divergences} ${divergences === 1 ? "divergência" : "divergências"}`;
  const unanalyzedLabel = `${unanalyzed} não ${unanalyzed === 1 ? "analisado" : "analisados"}`;

  if (divergences > 0 && unanalyzed > 0) return `${divergenceLabel} · ${unanalyzedLabel}`;
  if (divergences > 0) return divergenceLabel;
  if (unanalyzed > 0) return unanalyzedLabel;
  return "Conforme";
}

/** Variante do Badge usada para cada estado do resultado. */
export function analysisResultBadgeVariant(
  analysis: BillingAnalysis,
): "warning-soft" | "success-soft" | "destructive-soft" {
  if (analysis.status === "processing") return "warning-soft";
  if (analysis.status === "failed") return "destructive-soft";
  if (analysis.divergenceCount > 0) return "destructive-soft";
  // Itens não analisados não são sucesso: nunca equivalem a "sem divergência".
  if (analysis.unanalyzedCount > 0) return "warning-soft";
  return "success-soft";
}
