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
  extracting: "Aguardando análise",
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

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatBrDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
}

/** Título da regra na lista compacta de revisão. */
export function contractRuleTitle(rule: ContractRuleDraft): string {
  return rule.category.trim() || "Regra geral do contrato";
}

/**
 * Resumo dinâmico da regra para a revisão: mostra só o que se aplica ao tipo de
 * regra (base de referência, códigos, desconto/acréscimo, fator ou valor fixo).
 */
export function summarizeContractRule(rule: ContractRuleDraft): string {
  const parts: string[] = [];
  const codes = parseRuleCodes(rule.codes);

  if (rule.baseType === "contract") {
    parts.push(codes.length > 0 ? `Código ${codes.join(", ")}` : "Valor negociado");
  } else if (rule.baseType !== "none") {
    parts.push(contractRuleBaseLabel(rule.baseType));
    if (codes.length > 0) parts.push(`Código ${codes.join(", ")}`);
  } else if (codes.length > 0) {
    parts.push(`Código ${codes.join(", ")}`);
  }

  if (rule.adjustmentPercent !== 0) {
    const sign = rule.adjustmentPercent > 0 ? "Acréscimo" : "Desconto";
    parts.push(`${sign} de ${Math.abs(rule.adjustmentPercent).toLocaleString("pt-BR")}%`);
  } else if (rule.baseType !== "contract" && rule.baseType !== "none") {
    parts.push(`Fator ${rule.factor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  }

  if (rule.negotiatedValue !== null) parts.push(formatCurrency(rule.negotiatedValue));

  return parts.join(" · ");
}

/** Vigência da regra em texto; vazio quando o contrato não informa datas. */
export function formatContractRuleValidity(rule: ContractRuleDraft): string {
  const from = rule.validFrom ? formatBrDate(rule.validFrom) : "";
  const to = rule.validTo ? formatBrDate(rule.validTo) : "";
  if (from && to) return `${from} – ${to}`;
  if (from) return `A partir de ${from}`;
  if (to) return `Até ${to}`;
  return "";
}

function selectRule(
  rules: ContractRule[],
  item: { code: string; category: string },
): ContractRule | null {
  const code = item.code.trim().toUpperCase();
  const category = item.category.trim().toLowerCase();

  const byCode = rules.find((rule) => code !== "" && parseRuleCodes(rule.codes).includes(code));
  if (byCode) return byCode;

  /** Regras com códigos específicos só valem para esses códigos. */
  const byCategory = rules.find((rule) => {
    if (rule.codes.trim() !== "") return false;
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
  return rules.find((rule) => rule.codes.trim() === "" && rule.category.trim() === "") ?? null;
}

function isWithinValidity(rule: ContractRule, executedAt: string): boolean {
  if (!executedAt) return true;
  if (rule.validFrom && executedAt < rule.validFrom) return false;
  if (rule.validTo && executedAt > rule.validTo) return false;
  return true;
}

export type RuleMatch =
  | { kind: "matched"; rule: ContractRule }
  | { kind: "out_of_validity"; rule: ContractRule }
  | { kind: "not_found" };

/**
 * Regra aplicável a um item. Quando a regra só existe fora da vigência da data
 * do item, isso é informado separadamente para compor o motivo.
 */
export function matchRuleForItem(
  rules: ContractRule[],
  item: { code: string; category: string; executedAt: string },
): RuleMatch {
  const valid = selectRule(
    rules.filter((rule) => isWithinValidity(rule, item.executedAt)),
    item,
  );
  if (valid) return { kind: "matched", rule: valid };
  const any = selectRule(rules, item);
  if (any) return { kind: "out_of_validity", rule: any };
  return { kind: "not_found" };
}

/** Regra aplicável a um item, considerando código, categoria e vigência. */
export function findRuleForItem(
  rules: ContractRule[],
  item: { code: string; category: string; executedAt: string },
): ContractRule | null {
  const match = matchRuleForItem(rules, item);
  return match.kind === "matched" ? match.rule : null;
}
