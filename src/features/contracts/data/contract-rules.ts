/** Regras de remuneração extraídas do arquivo do contrato (tabela `contract_rules`). */

/** Referência usada pela regra para calcular o valor esperado. */
export type ContractRuleBase = "brasindice" | "simpro" | "cbhpm" | "contract" | "none";

export const CONTRACT_RULE_BASES: readonly ContractRuleBase[] = [
  "brasindice",
  "simpro",
  "cbhpm",
  "contract",
  "none",
] as const;

const CONTRACT_RULE_BASE_LABELS: Record<ContractRuleBase, string> = {
  brasindice: "Brasíndice",
  simpro: "SIMPRO",
  cbhpm: "CBHPM",
  contract: "Valor negociado no contrato",
  none: "Não definida",
};

export function contractRuleBaseLabel(base: ContractRuleBase): string {
  return CONTRACT_RULE_BASE_LABELS[base];
}

export function toContractRuleBase(value: string | null | undefined): ContractRuleBase {
  return (CONTRACT_RULE_BASES as readonly string[]).includes(value ?? "")
    ? (value as ContractRuleBase)
    : "none";
}

/** Dados editáveis de uma regra, usados no formulário de revisão e na gravação. */
export interface ContractRuleDraft {
  /** Categoria de cobrança descrita no contrato (medicamentos, materiais, procedimentos…). */
  category: string;
  baseType: ContractRuleBase;
  /** Códigos específicos separados por vírgula; vazio aplica a regra à categoria inteira. */
  codes: string;
  /** Fator/multiplicador aplicado ao valor de referência. */
  factor: number;
  /** Desconto (negativo) ou acréscimo (positivo) em porcentagem. */
  adjustmentPercent: number;
  /** Valor negociado diretamente no contrato, quando houver. */
  negotiatedValue: number | null;
  /** Vigência da regra em yyyy-MM-dd, vazio quando não informada. */
  validFrom: string;
  validTo: string;
  /** Trecho do contrato que originou a regra, para conferência. */
  sourceExcerpt: string;
}

export interface ContractRule extends ContractRuleDraft {
  id: string;
  contractId: string;
  /** Marca que a regra já foi conferida por uma pessoa. */
  reviewed: boolean;
}

/** Situação das regras de remuneração de um contrato. */
export type ContractRulesStatus = "not_extracted" | "pending_review" | "reviewed";

/** Situação exibida na listagem, incluindo a leitura em andamento e a falha. */
export type ContractRulesDisplayStatus = ContractRulesStatus | "extracting" | "failed";

const CONTRACT_RULES_STATUS_LABELS: Record<ContractRulesDisplayStatus, string> = {
  not_extracted: "Não extraídas",
  pending_review: "Revisão pendente",
  reviewed: "Revisadas",
  extracting: "Analisando...",
  failed: "Falha na análise",
};

export function contractRulesStatusLabel(status: ContractRulesDisplayStatus): string {
  return CONTRACT_RULES_STATUS_LABELS[status];
}

/** Situação derivada das regras salvas: nunca definida apenas visualmente. */
export function contractRulesStatusOf(
  rules: Pick<ContractRule, "reviewed">[],
): ContractRulesStatus {
  if (rules.length === 0) return "not_extracted";
  return rules.every((rule) => rule.reviewed) ? "reviewed" : "pending_review";
}

export function emptyContractRuleDraft(): ContractRuleDraft {
  return {
    category: "",
    baseType: "none",
    codes: "",
    factor: 1,
    adjustmentPercent: 0,
    negotiatedValue: null,
    validFrom: "",
    validTo: "",
    sourceExcerpt: "",
  };
}

/** Códigos informados na regra, normalizados (sem espaços, em maiúsculas). */
export function parseRuleCodes(codes: string): string[] {
  return codes
    .split(/[,;\s]+/)
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code !== "");
}

/** Descrição curta da regra aplicada, guardada junto do resultado do item. */
export function describeContractRule(rule: ContractRule): string {
  if (rule.baseType === "contract" && rule.negotiatedValue !== null) {
    return `Valor negociado no contrato: ${rule.negotiatedValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}`;
  }
  const parts = [contractRuleBaseLabel(rule.baseType)];
  if (rule.factor !== 1) parts.push(`fator ${rule.factor.toLocaleString("pt-BR")}`);
  if (rule.adjustmentPercent !== 0) {
    const sign = rule.adjustmentPercent > 0 ? "acréscimo" : "desconto";
    parts.push(`${sign} de ${Math.abs(rule.adjustmentPercent).toLocaleString("pt-BR")}%`);
  }
  if (rule.category) parts.push(`categoria ${rule.category}`);
  return parts.join(" · ");
}

/** Regra aplicável a um item, considerando código, categoria e vigência. */
export function findRuleForItem(
  rules: ContractRule[],
  item: { code: string; category: string; executedAt: string },
): ContractRule | null {
  const code = item.code.trim().toUpperCase();
  const category = item.category.trim().toLowerCase();

  const withinValidity = (rule: ContractRule) => {
    if (!item.executedAt) return true;
    if (rule.validFrom && item.executedAt < rule.validFrom) return false;
    if (rule.validTo && item.executedAt > rule.validTo) return false;
    return true;
  };

  const candidates = rules.filter(withinValidity);

  const byCode = candidates.find(
    (rule) => code !== "" && parseRuleCodes(rule.codes).includes(code),
  );
  if (byCode) return byCode;

  const byCategory = candidates.find((rule) => {
    const ruleCategory = rule.category.trim().toLowerCase();
    if (ruleCategory === "" || category === "") return false;
    return (
      ruleCategory === category ||
      category.includes(ruleCategory) ||
      ruleCategory.includes(category)
    );
  });
  if (byCategory) return byCategory;

  /** Regra geral: sem códigos e sem categoria específica. */
  return candidates.find((rule) => rule.codes.trim() === "" && rule.category.trim() === "") ?? null;
}
