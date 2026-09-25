import { supabase } from "@/integrations/supabase/client";
import { CURRENT_USER } from "@/lib/current-user";
import {
  inferPricingBaseType,
  toPricingBaseType,
  toPricingVersionStatus,
  type NewPricingVersionInput,
  type PricingUnprocessedReason,
  type PricingVersion,
  type PricingVersionStatus,
} from "./pricing-versions";
import { analyzePricingContent } from "./pricing-file-analysis";

const BUCKET = "pricing-versions";
/** Validade das URLs assinadas geradas para baixar o arquivo. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const pricingVersionsQueryKey = ["pricing-versions"] as const;

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
}

/** Cria uma URL temporária para baixar o arquivo salvo no storage. */
function toReasons(value: unknown): PricingUnprocessedReason[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];
    const { reason, count } = item as { reason?: unknown; count?: unknown };
    return typeof reason === "string" && typeof count === "number" ? [{ reason, count }] : [];
  });
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface StatusUpdate {
  status: PricingVersionStatus;
  status_problem?: string | null;
  status_guidance?: string | null;
  processed_count?: number | null;
  unprocessed_count?: number | null;
  unprocessed_reasons?: PricingUnprocessedReason[] | null;
  retryable?: boolean;
}

async function updateStatus(id: string, update: StatusUpdate): Promise<void> {
  const { error } = await supabase.from("pricing_versions").update(update).eq("id", id);
  if (error) throw error;
}

/** Error thrown so the background task shows its failure state after the status is saved. */
export class PricingProcessingError extends Error {}

/**
 * Registers the file (status PENDING → PROCESSING), validates and reads its
 * records and persists the final status. Only EXTRACTED versions become "Atual".
 */
export async function createPricingVersion(
  input: NewPricingVersionInput,
  onRegistered?: () => void,
): Promise<void> {
  const baseType = input.baseType ?? inferPricingBaseType(input.file.name);
  const path = `${crypto.randomUUID()}-${sanitizeFileName(input.file.name)}`;
  const hash = await sha256(input.file);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType:
      input.file.type ||
      (input.file.name.toLowerCase().endsWith(".txt") ? "text/plain" : "text/csv"),
  });
  if (uploadError) throw uploadError;

  const { data: inserted, error } = await supabase
    .from("pricing_versions")
    .insert({
      file_name: input.file.name,
      file_path: path,
      file_type: input.file.type,
      base_type: baseType,
      created_by: CURRENT_USER.name,
      file_hash: hash,
      status: "PENDING",
    })
    .select("id")
    .single();
  if (error || !inserted) throw error ?? new Error("Não foi possível registrar a versão.");

  onRegistered?.();
  await processPricingVersion(inserted.id, input.file, baseType, hash);
}

async function processPricingVersion(
  id: string,
  file: File,
  baseType: string,
  hash: string,
): Promise<void> {
  await updateStatus(id, { status: "PROCESSING" });

  try {
    const { data: duplicates, error: duplicateError } = await supabase
      .from("pricing_versions")
      .select("id")
      .eq("base_type", baseType)
      .eq("file_hash", hash)
      .in("status", ["EXTRACTED", "PARTIALLY_EXTRACTED"])
      .neq("id", id)
      .limit(1);
    if (duplicateError) throw duplicateError;
    if ((duplicates ?? []).length > 0) {
      await updateStatus(id, {
        status: "DUPLICATE_FILE",
        status_problem:
          "Este arquivo já foi cadastrado anteriormente para este tipo de base. Nenhum dado novo foi encontrado.",
        status_guidance:
          "Se houver uma versão mais recente da base, cadastre o novo arquivo em Nova versão.",
      });
      throw new PricingProcessingError("Arquivo duplicado.");
    }

    const result = analyzePricingContent(file.name, await file.text());
    if (result.kind === "invalid") {
      await updateStatus(id, {
        status: "INVALID_FILE",
        status_problem: result.problem,
        status_guidance: result.guidance,
      });
      throw new PricingProcessingError("Arquivo inválido.");
    }

    const partial = result.unprocessedCount > 0;
    await updateStatus(id, {
      status: partial ? "PARTIALLY_EXTRACTED" : "EXTRACTED",
      status_problem: partial
        ? `${result.processedCount} registros foram processados, mas ${result.unprocessedCount} não puderam ser lidos. Por isso, esta versão não passou a ser a atual.`
        : null,
      status_guidance: partial
        ? "Corrija os registros indicados no arquivo e cadastre-o novamente em Nova versão."
        : null,
      processed_count: result.processedCount,
      unprocessed_count: result.unprocessedCount,
      unprocessed_reasons: partial ? result.reasons : null,
    });
    if (partial) throw new PricingProcessingError("Processado parcialmente.");
  } catch (cause) {
    if (cause instanceof PricingProcessingError) throw cause;
    await updateStatus(id, {
      status: "PROCESSING_ERROR",
      status_problem:
        "Ocorreu um erro inesperado ao processar o arquivo. A versão atual da base continua vigente.",
      status_guidance: "Tente processar novamente. Se o erro persistir, envie um novo arquivo.",
      retryable: true,
    }).catch(() => undefined);
    throw cause;
  }
}

/** Reprocessa uma versão que falhou, usando o arquivo já armazenado. */
export async function retryPricingVersion(version: PricingVersion): Promise<void> {
  const blob = await downloadPricingVersionBlob(version.file.path);
  const file = new File([blob], version.file.name, { type: version.file.type });
  await updateStatus(version.id, {
    status: "PENDING",
    status_problem: null,
    status_guidance: null,
    processed_count: null,
    unprocessed_count: null,
    unprocessed_reasons: null,
    retryable: false,
  });
  await processPricingVersion(version.id, file, version.baseType, await sha256(file));
}

/** Ferramenta provisória de testes: apaga todas as versões e seus arquivos. */
export async function deleteAllPricingVersions(): Promise<void> {
  const { data, error: listError } = await supabase
    .from("pricing_versions")
    .select("id, file_path");
  if (listError) throw listError;

  const paths = (data ?? []).map((row) => row.file_path).filter(Boolean);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) throw removeError;
  }

  const ids = (data ?? []).map((row) => row.id);
  if (ids.length > 0) {
    const { error } = await supabase.from("pricing_versions").delete().in("id", ids);
    if (error) throw error;
  }
}
