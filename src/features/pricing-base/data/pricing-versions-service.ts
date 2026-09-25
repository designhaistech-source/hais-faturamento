import { supabase } from "@/integrations/supabase/client";
import { CURRENT_USER } from "@/lib/current-user";
import {
  parsePricingImport,
  isKnownImportStatus,
  toImportStatus,
  type ImportErrorRow,
  type ImportStatus,
} from "./pricing-import";
import {
  inferPricingBaseType,
  toPricingBaseType,
  type NewPricingVersionInput,
  type PricingVersion,
} from "./pricing-versions";

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
export async function createPricingVersionFileUrl(
  path: string,
  downloadAs?: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      path,
      SIGNED_URL_TTL_SECONDS,
      downloadAs ? { download: downloadAs } : undefined,
    );
  if (error || !data) throw error ?? new Error("Não foi possível abrir o arquivo da versão.");
  return data.signedUrl;
}

/** Cache em memória (por sessão) dos arquivos já baixados do storage. */
const pricingBlobCache = new Map<string, Promise<Blob>>();

/** Baixa o CSV da versão para uso nas análises de faturamento. */
export function downloadPricingVersionBlob(path: string): Promise<Blob> {
  const cached = pricingBlobCache.get(path);
  if (cached) return cached;

  const request = supabase.storage
    .from(BUCKET)
    .download(path)
    .then(({ data, error }) => {
      if (error || !data) {
        throw error ?? new Error("Não foi possível carregar o arquivo da versão.");
      }
      return data;
    })
    .catch((cause: unknown) => {
      pricingBlobCache.delete(path);
      throw cause;
    });

  pricingBlobCache.set(path, request);
  return request;
}

/** Versões da base de precificação, da mais recente para a mais antiga. */
export async function listPricingVersions(): Promise<PricingVersion[]> {
  const { data, error } = await supabase
    .from("pricing_versions")
    .select(
      "id, created_at, created_by, base_type, version_month, file_name, file_path, file_type, status, status_problem, processed_count, unprocessed_count, unprocessed_reasons",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    versionMonth: row.version_month?.slice(0, 7) ?? "",
    baseType: toPricingBaseType(row.base_type),
    file: {
      name: row.file_name,
      path: row.file_path,
      type: row.file_type ?? "",
    },
    importStatus: toImportStatus(row.status),
    importProblem: row.status_problem,
    processedCount: row.processed_count,
    // Legacy rows have no import status and no processed count; absence is not "0 records".
    detailsAvailable:
      isKnownImportStatus(row.status) && row.processed_count !== null
        ? true
        : isKnownImportStatus(row.status) && row.status !== "COMPLETED",
    errorCount: row.unprocessed_count,
    errorRows: toErrorRows(row.unprocessed_reasons),
  }));
}

function toErrorRows(value: unknown): ImportErrorRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];
    const row = item as Record<string, unknown>;
    if (typeof row.line !== "number" || typeof row.reason !== "string") return [];
    return [{ line: row.line, reason: row.reason, content: String(row.content ?? "") }];
  });
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Versão (1 = primeira cadastrada daquele tipo) que já contém o mesmo arquivo. */
async function findDuplicateVersionNumber(baseType: string, hash: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("pricing_versions")
    .select("id, file_hash, status")
    .eq("base_type", baseType)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const index = (data ?? []).findIndex(
    (row) => row.file_hash === hash && toImportStatus(row.status) !== "FAILED",
  );
  return index === -1 ? null : index + 1;
}

/** Cadastra o arquivo e registra o resultado da importação; devolve o status obtido. */
export async function createPricingVersion(input: NewPricingVersionInput): Promise<ImportStatus> {
  const baseType = input.baseType ?? inferPricingBaseType(input.file.name);
  const hash = await sha256(input.file);

  let status: ImportStatus;
  let problem: string | null = null;
  let processedCount: number | null = null;
  let errorCount: number | null = null;
  let errorRows: ImportErrorRow[] = [];
  try {
    const duplicateOf = await findDuplicateVersionNumber(baseType, hash);
    if (duplicateOf !== null) {
      status = "FAILED";
      problem = `Este arquivo já foi importado (versão ${duplicateOf}).`;
    } else {
      const result = parsePricingImport(await input.file.text());
      status = result.status;
      problem = result.problem;
      if (result.problem === null) {
        processedCount = result.records.length;
        errorCount = result.errors.length;
        errorRows = result.errors;
      }
    }
  } catch (cause) {
    status = "FAILED";
    problem = cause instanceof Error ? cause.message : "Erro inesperado durante a importação.";
  }

  const path = `${crypto.randomUUID()}-${sanitizeFileName(input.file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType:
      input.file.type ||
      (input.file.name.toLowerCase().endsWith(".txt") ? "text/plain" : "text/csv"),
  });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("pricing_versions").insert({
    file_name: input.file.name,
    file_path: path,
    file_type: input.file.type,
    base_type: baseType,
    created_by: CURRENT_USER.name,
    file_hash: hash,
    status,
    status_problem: problem,
    processed_count: processedCount,
    unprocessed_count: errorCount,
    unprocessed_reasons: errorRows.map((row) => ({ ...row })),
  });
  if (error) throw error;
  return status;
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
