import { supabase } from "@/integrations/supabase/client";
import { CURRENT_USER } from "@/lib/current-user";
import type { NewTussVersionInput, TussVersion } from "./tuss-versions";

const BUCKET = "tuss-versions";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const tussVersionsQueryKey = ["tuss-versions"] as const;

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function createTussVersionFileUrl(path: string, downloadAs: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, { download: downloadAs });
  if (error || !data) throw error ?? new Error("Não foi possível abrir o arquivo da versão.");
  return data.signedUrl;
}

/** Versões TUSS, da mais recente para a mais antiga. */
export async function listTussVersions(): Promise<TussVersion[]> {
  const { data, error } = await supabase
    .from("tuss_versions")
    .select(
      "id, version_month, table_name, created_at, created_by, file_name, file_path, file_type",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    versionMonth: row.version_month.slice(0, 7),
    tableName: row.table_name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    file: { name: row.file_name, path: row.file_path, type: row.file_type ?? "" },
  }));
}

export async function createTussVersion(input: NewTussVersionInput): Promise<void> {
  const path = `${crypto.randomUUID()}-${sanitizeFileName(input.file.name)}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.file.type || "application/octet-stream",
  });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("tuss_versions").insert({
    version_month: `${input.versionMonth}-01`,
    table_name: input.tableName.trim(),
    file_name: input.file.name,
    file_path: path,
    file_type: input.file.type,
    created_by: CURRENT_USER.name,
  });
  if (error) throw error;
}

/** Ferramenta provisória de testes: apaga todas as versões e seus arquivos. */
export async function deleteAllTussVersions(): Promise<void> {
  const { data, error: listError } = await supabase.from("tuss_versions").select("id, file_path");
  if (listError) throw listError;

  const paths = (data ?? []).map((row) => row.file_path).filter(Boolean);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) throw removeError;
  }
  const ids = (data ?? []).map((row) => row.id);
  if (ids.length > 0) {
    const { error } = await supabase.from("tuss_versions").delete().in("id", ids);
    if (error) throw error;
  }
}
