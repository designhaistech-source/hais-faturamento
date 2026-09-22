/** Análises de faturamento realizadas a partir de arquivos XML TISS. */

export type BillingAnalysisStatus = "processing" | "completed" | "failed";

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

function firstTagValue(document: Document, tagNames: readonly string[]): string | null {
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

const PROVIDER_TAGS = ["nomeContratado", "nomePrestador", "razaoSocial"] as const;
const PROVIDER_CNPJ_TAGS = [
  "cnpjContratado",
  "CNPJ",
  "cnpj",
  "codigoPrestadorNaOperadora",
] as const;
const HEALTH_PLAN_TAGS = ["nomeOperadora", "razaoSocialOperadora"] as const;
const HEALTH_PLAN_ANS_TAGS = ["registroANS", "numeroRegistroANS"] as const;

/** Formata 14 dígitos como CNPJ (00.000.000/0000-00); retorna null se não houver 14 dígitos. */
function formatCnpj(value: string): string | null {
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
  const count = analysis.divergenceCount;
  if (count === 0) return "Sem divergências";
  return `${count} ${count === 1 ? "divergência" : "divergências"}`;
}

/** Variante do Badge usada para cada estado do resultado. */
export function analysisResultBadgeVariant(
  analysis: BillingAnalysis,
): "warning-soft" | "success-soft" | "destructive-soft" {
  if (analysis.status === "processing") return "warning-soft";
  if (analysis.status === "failed") return "destructive-soft";
  return analysis.divergenceCount > 0 ? "destructive-soft" : "success-soft";
}
