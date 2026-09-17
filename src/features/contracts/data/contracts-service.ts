import { supabase } from "@/integrations/supabase/client";
import type { Contract, NewContractInput } from "./contracts";

const BUCKET = "contracts";
/** Validade das URLs assinadas geradas para visualizar/baixar o arquivo. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export const contractsQueryKey = ["contracts"] as const;

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
}

/** Cria uma URL temporária para o arquivo salvo no storage. */
export async function createContractFileUrl(path: string, downloadAs?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(
      path,
      SIGNED_URL_TTL_SECONDS,
      downloadAs ? { download: downloadAs } : undefined,
    );
  if (error || !data) throw error ?? new Error("Não foi possível abrir o arquivo do contrato.");
  return data.signedUrl;
}

/**
 * Cache em memória (por sessão) dos arquivos já recuperados do storage. Evita
 * baixar novamente o mesmo contrato ao reabrir a pré-visualização.
 */
const contractBlobCache = new Map<string, Promise<Blob>>();

/** Baixa o arquivo do storage como blob, para pré-visualização dentro do produto. */
export async function downloadContractBlob(path: string): Promise<Blob> {
  const cached = contractBlobCache.get(path);
  if (cached) return cached;

  const request = supabase.storage
    .from(BUCKET)
    .download(path)
    .then(({ data, error }) => {
      if (error || !data) {
        throw error ?? new Error("Não foi possível carregar o arquivo do contrato.");
      }
      return data;
    })
    .catch((cause: unknown) => {
      contractBlobCache.delete(path);
      throw cause;
    });

  contractBlobCache.set(path, request);
  return request;
}

export async function listContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, company, cnpj, valid_until, file_name, file_path, file_type")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    company: row.company,
    cnpj: row.cnpj ?? "",
    validUntil: row.valid_until ?? "",
    file: {
      name: row.file_name,
      path: row.file_path,
      type: row.file_type ?? "",
    },
  }));
}

export async function createContract(input: NewContractInput): Promise<void> {
  const path = `${crypto.randomUUID()}-${sanitizeFileName(input.file.name)}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.file.type || "application/octet-stream",
  });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("contracts").insert({
    company: input.company,
    cnpj: input.cnpj,
    valid_until: input.validUntil ? input.validUntil : null,
    file_name: input.file.name,
    file_path: path,
    file_type: input.file.type,
  });
  if (error) throw error;
}

/** Antecipa o download do arquivo (hover/foco) para a pré-visualização abrir imediata. */
export function prefetchContractFile(path: string): void {
  void downloadContractBlob(path).catch(() => undefined);
}

/**
 * Ferramenta provisória de testes: remove todos os contratos e os arquivos
 * correspondentes no storage.
 */
export async function deleteAllContracts(): Promise<void> {
  const { data, error: listError } = await supabase.from("contracts").select("id, file_path");
  if (listError) throw listError;

  const paths = (data ?? []).map((row) => row.file_path).filter(Boolean);
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) throw removeError;
    paths.forEach((path) => contractBlobCache.delete(path));
  }

  const ids = (data ?? []).map((row) => row.id);
  if (ids.length > 0) {
    const { error } = await supabase.from("contracts").delete().in("id", ids);
    if (error) throw error;
  }
}
