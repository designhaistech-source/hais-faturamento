import { supabase } from "@/integrations/supabase/client";
import { CURRENT_USER } from "@/lib/current-user";
import type { NewPricingVersionInput, PricingVersion } from "./pricing-versions";

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

/** Versões da base de precificação, da mais recente para a mais antiga. */
export async function listPricingVersions(): Promise<PricingVersion[]> {
  const { data, error } = await supabase
    .from("pricing_versions")
    .select("id, created_at, created_by, file_name, file_path, file_type")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    createdBy: row.created_by,
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
    contentType: input.file.type || "text/csv",
  });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("pricing_versions").insert({
    file_name: input.file.name,
    file_path: path,
    file_type: input.file.type,
    created_by: CURRENT_USER.name,
  });
  if (error) throw error;
}
