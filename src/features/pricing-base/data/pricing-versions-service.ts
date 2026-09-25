import { supabase } from "@/integrations/supabase/client";
import { CURRENT_USER } from "@/lib/current-user";
import {
  parsePricingImportFiles,
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
      "id, created_at, created_by, base_type, version_month, file_name, file_path, file_type, status, status_problem, processed_count, unprocessed_count, unprocessed_reasons, pricing_version_files(position, file_name, file_path, file_type)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const primary = { name: row.file_name, path: row.file_path, type: row.file_type ?? "" };
    const parts = [...(row.pricing_version_files ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((part) => ({ name: part.file_name, path: part.file_path, type: part.file_type ?? "" }));
    return {
      id: row.id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      versionMonth: row.version_month?.slice(0, 7) ?? "",
      baseType: toPricingBaseType(row.base_type),
      file: primary,
      files: parts.length > 0 ? parts : [primary],
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
    };
  });
}

function toErrorRows(value: unknown): ImportErrorRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (typeof item !== "object" || item === null) return [];
    const row = item as Record<string, unknown>;
    if (typeof row.line !== "number" || typeof row.reason !== "string") return [];
    return [
      {
        line: row.line,
        ...(typeof row.file === "string" ? { file: row.file } : {}),
        reason: row.reason,
        content: String(row.content ?? ""),
      },
    ];
  });
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Cadastra a versão (um ou mais arquivos) e registra o resultado da importação do conjunto. */
export async function createPricingVersion(input: NewPricingVersionInput): Promise<ImportStatus> {
  const [first] = input.files;
  if (!first) throw new Error("Nenhum arquivo selecionado.");
  const baseType = input.baseType ?? inferPricingBaseType(first.name);
  const hash = await sha256(first);

  let status: ImportStatus;
  let problem: string | null = null;
  let processedCount: number | null = null;
  let errorCount: number | null = null;
  let errorRows: ImportErrorRow[] = [];
  // Arquivos repetidos são tratados como uma nova versão; FAILED indica apenas falhas inesperadas.
  try {
    const sources = await Promise.all(
      input.files.map(async (file) => ({ name: file.name, content: await file.text() })),
    );
    const result = parsePricingImportFiles(sources);
    status = result.status;
    problem = result.problem;
    if (result.problem === null) {
      processedCount = result.records.length;
      errorCount = result.errors.length;
      errorRows = result.errors;
    }
  } catch (cause) {
    status = "FAILED";
    problem = cause instanceof Error ? cause.message : "Erro inesperado durante a importação.";
  }

  const uploaded: { file: File; path: string }[] = [];
  try {
    for (const file of input.files) {
      const path = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType:
          file.type || (file.name.toLowerCase().endsWith(".txt") ? "text/plain" : "text/csv"),
      });
      if (uploadError) throw uploadError;
      uploaded.push({ file, path });
    }

    const { data: version, error } = await supabase
      .from("pricing_versions")
      .insert({
        file_name: first.name,
        file_path: uploaded[0].path,
        file_type: first.type,
        base_type: baseType,
        created_by: CURRENT_USER.name,
        file_hash: hash,
        status,
        status_problem: problem,
        processed_count: processedCount,
        unprocessed_count: errorCount,
        unprocessed_reasons: errorRows.map((row) => ({ ...row })),
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: filesError } = await supabase.from("pricing_version_files").insert(
      uploaded.map(({ file, path }, position) => ({
        version_id: version.id,
        position,
        file_name: file.name,
        file_path: path,
        file_type: file.type,
      })),
    );
    if (filesError) {
      await supabase.from("pricing_versions").delete().eq("id", version.id);
      throw filesError;
    }
  } catch (cause) {
    if (uploaded.length > 0) {
      await supabase.storage.from(BUCKET).remove(uploaded.map(({ path }) => path));
    }
    throw cause;
  }
  return status;
}

/** Ferramenta provisória de testes: apaga todas as versões e seus arquivos. */
export async function deleteAllPricingVersions(): Promise<void> {
  const { data, error: listError } = await supabase
    .from("pricing_versions")
    .select("id, file_path, pricing_version_files(file_path)");
  if (listError) throw listError;

  const paths = [
    ...new Set(
      (data ?? []).flatMap((row) => [
        row.file_path,
        ...(row.pricing_version_files ?? []).map((part) => part.file_path),
      ]),
    ),
  ].filter(Boolean);
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
