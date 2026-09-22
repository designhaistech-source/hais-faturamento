/** Análises de faturamento realizadas a partir de arquivos XML TISS. */

export type BillingAnalysisStatus = "processing" | "completed";

export interface BillingAnalysis {
  id: string;
  /** Nome do arquivo XML enviado. */
  fileName: string;
  /** Prestador identificado no XML TISS. */
  provider: string;
  /** Operadora identificada no XML TISS. */
  healthPlan: string;
  /** ISO timestamp do momento da análise. */
  analyzedAt: string;
  status: BillingAnalysisStatus;
  /** Quantidade de divergências encontradas (apenas quando concluída). */
  divergenceCount?: number;
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
const HEALTH_PLAN_TAGS = ["nomeOperadora", "registroANS"] as const;

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
    return {
      provider: firstTagValue(parsed, PROVIDER_TAGS) ?? UNIDENTIFIED_LABEL,
      healthPlan: firstTagValue(parsed, HEALTH_PLAN_TAGS) ?? UNIDENTIFIED_LABEL,
    };
  } catch {
    return { provider: UNIDENTIFIED_LABEL, healthPlan: UNIDENTIFIED_LABEL };
  }
}

/** Rótulo do resultado da análise para exibição no badge de status. */
export function analysisResultLabel(analysis: BillingAnalysis): string {
  if (analysis.status === "processing") return "Processando";
  const count = analysis.divergenceCount ?? 0;
  if (count === 0) return "Sem divergências";
  return `${count} ${count === 1 ? "divergência" : "divergências"}`;
}

/** Variante do Badge usada para cada estado do resultado. */
export function analysisResultBadgeVariant(
  analysis: BillingAnalysis,
): "warning-soft" | "success-soft" | "destructive-soft" {
  if (analysis.status === "processing") return "warning-soft";
  return (analysis.divergenceCount ?? 0) > 0 ? "destructive-soft" : "success-soft";
}
