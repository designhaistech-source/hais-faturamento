import { supabase } from "@/integrations/supabase/client";
import { extractContractRules } from "@/lib/contract-rules.functions";

import type { Contract } from "./contracts";
import { readContractText } from "./contract-text";

const BUCKET = "contracts";

export type AmendmentExtractionStatus = "extracting" | "available" | "not_identified" | "failed";

export const AMENDMENT_EXTRACTION_STATUSES: readonly AmendmentExtractionStatus[] = [
  "extracting",
  "available",
  "not_identified",
  "failed",
];

export interface ContractAmendment {
  id: string;
  contractId: string;
  createdBy: string;
  createdAt: string;
  /** Status desconhecido vindo do banco é tratado como falha, nunca como concluído. */
  extractionStatus: AmendmentExtractionStatus;
  file: { name: string; path: string; type: string };
}

export const contractAmendmentsQueryKey = (contractId: string) =>
  ["contract-amendments", contractId] as const;

function toStatus(value: string): AmendmentExtractionStatus {
  return (AMENDMENT_EXTRACTION_STATUSES as readonly string[]).includes(value)
    ? (value as AmendmentExtractionStatus)
    : "failed";
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
}

const COLUMNS =
  "id, contract_id, file_name, file_path, file_type, created_by, created_at, extraction_status";

type Row = {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_by: string;
  created_at: string;
  extraction_status: string;
};

function toAmendment(row: Row): ContractAmendment {
  return {
    id: row.id,
    contractId: row.contract_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    extractionStatus: toStatus(row.extraction_status),
    file: { name: row.file_name, path: row.file_path, type: row.file_type ?? "" },
  };
}

export async function listContractAmendments(contractId: string): Promise<ContractAmendment[]> {
  const { data, error } = await supabase
    .from("contract_amendments")
    .select(COLUMNS)
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toAmendment);
}

export async function createContractAmendment(input: {
  contractId: string;
  file: File;
  createdBy: string;
}): Promise<ContractAmendment> {
  const path = `amendments/${input.contractId}/${crypto.randomUUID()}-${sanitizeFileName(input.file.name)}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    contentType: input.file.type || "application/octet-stream",
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("contract_amendments")
    .insert({
      contract_id: input.contractId,
      file_name: input.file.name,
      file_path: path,
      file_type: input.file.type,
      created_by: input.createdBy,
      extraction_status: "extracting",
    })
    .select(COLUMNS)
    .single();
  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error ?? new Error("Não foi possível cadastrar o aditivo.");
  }
  return toAmendment(data);
}

async function setStatus(id: string, status: AmendmentExtractionStatus) {
  const { error } = await supabase
    .from("contract_amendments")
    .update({ extraction_status: status })
    .eq("id", id);
  if (error) throw error;
}

/** Adapta o aditivo ao formato de arquivo usado pela leitura e pré-visualização de contratos. */
export function amendmentAsContractFile(amendment: ContractAmendment, company: string): Contract {
  return {
    id: amendment.id,
    company,
    cnpj: "",
    validUntil: "",
    file: amendment.file,
  };
}

/**
 * Lê o texto do aditivo e executa a mesma extração usada nos contratos.
 * O resultado só define o status da extração do aditivo.
 */
export async function extractAmendment(
  amendment: ContractAmendment,
  company: string,
): Promise<AmendmentExtractionStatus> {
  try {
    const text = await readContractText(amendmentAsContractFile(amendment, company));
    if (text.length < 40) throw new Error("Não foi possível ler o texto do aditivo.");
    const rules = await extractContractRules({ data: { contractText: text } });
    const status: AmendmentExtractionStatus = rules.length > 0 ? "available" : "not_identified";
    await setStatus(amendment.id, status);
    return status;
  } catch (cause) {
    await setStatus(amendment.id, "failed").catch(() => undefined);
    throw cause;
  }
}
