import { supabase } from "@/integrations/supabase/client";
import { CURRENT_USER } from "@/lib/current-user";
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
    .select("id, created_at, created_by, base_type, file_name, file_path, file_type")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    baseType: toPricingBaseType(row.base_type),
    file: {
      name: row.file_name,
      path: row.file_path,
      type: row.file_type ?? "",
    },
  }));
}

export async function createPricingVersion(input: NewPricingVersionInput): Promise<void> {
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
    base_type: input.baseType ?? inferPricingBaseType(input.file.name),
    created_by: CURRENT_USER.name,
  });
  if (error) throw error;
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
