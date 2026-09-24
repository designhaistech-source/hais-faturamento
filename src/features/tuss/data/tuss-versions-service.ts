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

/** Versões TUSS, da mais recente para a mais antiga, com todas as partes. */
export async function listTussVersions(): Promise<TussVersion[]> {
  const { data, error } = await supabase
    .from("tuss_versions")
    .select(
      "id, version_month, table_name, created_at, created_by, file_name, file_path, file_type, tuss_version_files(file_name, file_path, file_type, position)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const primary = { name: row.file_name, path: row.file_path, type: row.file_type ?? "" };
    const parts = [...(row.tuss_version_files ?? [])]
      .sort((x, y) => x.position - y.position)
      .map((part) => ({ name: part.file_name, path: part.file_path, type: part.file_type ?? "" }));
    // Records created before multi-part support only have the primary file.
    const files = parts.length > 0 ? parts : [primary];
    return {
      id: row.id,
      versionMonth: row.version_month.slice(0, 7),
      tableName: row.table_name,
      createdAt: row.created_at,
      createdBy: row.created_by,
      file: files[0] ?? primary,
      files,
    };
  });
}

export async function createTussVersion(input: NewTussVersionInput): Promise<void> {
  if (input.files.length === 0) throw new Error("Nenhum arquivo informado.");
  const uploaded: { name: string; path: string; type: string }[] = [];
  try {
    for (const file of input.files) {
      const path = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      uploaded.push({ name: file.name, path, type: file.type });
    }

    const [first] = uploaded;
    if (!first) throw new Error("Nenhum arquivo enviado.");
    const { data: version, error } = await supabase
      .from("tuss_versions")
      .insert({
        table_name: input.tableName.trim(),
        file_name: first.name,
        file_path: first.path,
        file_type: first.type,
        created_by: CURRENT_USER.name,
      })
      .select("id")
      .single();
    if (error || !version) throw error ?? new Error("Não foi possível cadastrar a tabela.");

    const { error: partsError } = await supabase.from("tuss_version_files").insert(
      uploaded.map((part, position) => ({
        version_id: version.id,
        position,
        file_name: part.name,
        file_path: part.path,
        file_type: part.type,
      })),
    );
    if (partsError) {
      await supabase.from("tuss_versions").delete().eq("id", version.id);
      throw partsError;
    }
  } catch (cause) {
    if (uploaded.length > 0) {
      await supabase.storage.from(BUCKET).remove(uploaded.map((part) => part.path));
    }
    throw cause;
  }
}

/** Ferramenta provisória de testes: apaga todas as versões e seus arquivos. */
export async function deleteAllTussVersions(): Promise<void> {
  const { data, error: listError } = await supabase
    .from("tuss_versions")
    .select("id, file_path, tuss_version_files(file_path)");
  if (listError) throw listError;

  const paths = [
    ...new Set(
      (data ?? [])
        .flatMap((row) => [row.file_path, ...(row.tuss_version_files ?? []).map((f) => f.file_path)])
        .filter(Boolean),
    ),
  ];
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
