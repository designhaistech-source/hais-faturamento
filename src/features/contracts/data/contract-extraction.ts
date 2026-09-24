import { useSyncExternalStore } from "react";

import { extractContractRules } from "@/lib/contract-rules.functions";

import type { Contract } from "./contracts";
import { toContractRuleBase, type ContractRuleDraft } from "./contract-rules";
import { saveContractRules } from "./contract-rules-service";
import { readContractText } from "./contract-text";

/** Situação da leitura automática em andamento (não persistida no banco). */
export type ContractExtractionState = "extracting" | "not_identified" | "failed";

const states = new Map<string, ContractExtractionState>();
const listeners = new Set<() => void>();
let snapshot: Record<string, ContractExtractionState> = {};

function emit() {
  snapshot = Object.fromEntries(states);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

/** Situação da leitura automática de cada contrato, reativa para a listagem. */
export function useContractExtractionStates(): Record<string, ContractExtractionState> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function contractExtractionStateOf(contractId: string): ContractExtractionState | undefined {
  return states.get(contractId);
}

export function clearContractExtractionState(contractId: string): void {
  if (!states.delete(contractId)) return;
  emit();
}

/** Converte o retorno da IA no formato editável das regras. */
export function toContractRuleDrafts(
  extracted: {
    category: string;
    baseType: string;
    codes: string;
    factor: number;
    adjustmentPercent: number;
    negotiatedValue: number | null;
    validFrom: string;
    validTo: string;
    sourceExcerpt: string;
  }[],
): ContractRuleDraft[] {
  return extracted.map((rule) => ({
    category: rule.category,
    baseType: toContractRuleBase(rule.baseType),
    codes: rule.codes,
    factor: Number.isFinite(rule.factor) ? rule.factor : 1,
    adjustmentPercent: Number.isFinite(rule.adjustmentPercent) ? rule.adjustmentPercent : 0,
    negotiatedValue: rule.negotiatedValue,
    validFrom: rule.validFrom,
    validTo: rule.validTo,
    sourceExcerpt: rule.sourceExcerpt,
  }));
}

/**
 * Lê o arquivo do contrato, extrai as regras com IA e as salva como revisão
 * pendente. Usada tanto após o cadastro do contrato quanto na tela de regras.
 */
export async function extractContractRulesFor(contract: Contract): Promise<ContractRuleDraft[]> {
  states.set(contract.id, "extracting");
  emit();
  try {
    const contractText = await readContractText(contract);
    if (contractText.length < 40) {
      throw new Error("Não foi possível ler o texto do arquivo do contrato.");
    }
    const extracted = await extractContractRules({ data: { contractText } });
    const drafts = toContractRuleDrafts(extracted);
    /** Regras extraídas ficam salvas como revisão pendente até a confirmação. */
    if (drafts.length > 0) await saveContractRules(contract.id, drafts, { reviewed: false });
    if (drafts.length > 0) states.delete(contract.id);
    else states.set(contract.id, "not_identified");
    emit();
    return drafts;
  } catch (cause) {
    states.set(contract.id, "failed");
    emit();
    throw cause;
  }
}
