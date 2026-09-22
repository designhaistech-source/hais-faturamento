import { supabase } from "@/integrations/supabase/client";

import {
  toContractRuleBase,
  type ContractRule,
  type ContractRuleDraft,
} from "./contract-rules";

export const contractRulesQueryKey = (contractId: string) =>
  ["contract-rules", contractId] as const;

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function listContractRules(contractId: string): Promise<ContractRule[]> {
  const { data, error } = await supabase
    .from("contract_rules")
    .select(
      "id, contract_id, category, base_type, codes, factor, adjustment_percent, negotiated_value, valid_from, valid_to, source_excerpt, reviewed",
    )
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    contractId: row.contract_id,
    category: row.category ?? "",
    baseType: toContractRuleBase(row.base_type),
    codes: row.codes ?? "",
    factor: toNumber(row.factor, 1),
    adjustmentPercent: toNumber(row.adjustment_percent, 0),
    negotiatedValue: row.negotiated_value === null ? null : toNumber(row.negotiated_value, 0),
    validFrom: row.valid_from ?? "",
    validTo: row.valid_to ?? "",
    sourceExcerpt: row.source_excerpt ?? "",
    reviewed: row.reviewed,
  }));
}

/** Substitui todas as regras do contrato pelas regras revisadas no formulário. */
export async function saveContractRules(
  contractId: string,
  rules: ContractRuleDraft[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("contract_rules")
    .delete()
    .eq("contract_id", contractId);
  if (deleteError) throw deleteError;

  if (rules.length === 0) return;

  const { error } = await supabase.from("contract_rules").insert(
    rules.map((rule) => ({
      contract_id: contractId,
      category: rule.category,
      base_type: rule.baseType,
      codes: rule.codes,
      factor: rule.factor,
      adjustment_percent: rule.adjustmentPercent,
      negotiated_value: rule.negotiatedValue,
      valid_from: rule.validFrom ? rule.validFrom : null,
      valid_to: rule.validTo ? rule.validTo : null,
      source_excerpt: rule.sourceExcerpt,
      reviewed: true,
    })),
  );
  if (error) throw error;
}
