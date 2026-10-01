import {
  contractRuleBaseLabel,
  formatContractRuleValidity,
  parseRuleCodes,
  type ContractRule,
} from "./contract-rules";

/** Classificação da regra usada no filtro "Tipo da regra". */
export type ContractRuleKind = "reference_table" | "negotiated_value" | "undefined";

const RULE_KIND_LABELS: Record<ContractRuleKind, string> = {
  reference_table: "Tabela de referência",
  negotiated_value: "Valor negociado",
  undefined: "Não definida",
};

export const CONTRACT_RULE_KINDS: readonly ContractRuleKind[] = [
  "reference_table",
  "negotiated_value",
  "undefined",
];

export function contractRuleKindLabel(kind: ContractRuleKind): string {
  return RULE_KIND_LABELS[kind];
}

export function contractRuleKindOf(rule: ContractRule): ContractRuleKind {
  if (rule.baseType === "contract" || rule.negotiatedValue !== null) return "negotiated_value";
  if (rule.baseType === "none") return "undefined";
  return "reference_table";
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Tabela de referência ou código específico que a regra usa. */
export function contractRuleReference(rule: ContractRule): string {
  if (rule.baseType !== "none" && rule.baseType !== "contract") {
    return contractRuleBaseLabel(rule.baseType);
  }
  const codes = parseRuleCodes(rule.codes);
  return codes.length > 0 ? `Código ${codes.join(", ")}` : "—";
}

/** Efeito principal: desconto/acréscimo, valor fixo ou fator. */
export function contractRuleEffect(rule: ContractRule): string {
  if (rule.adjustmentPercent !== 0) {
    const sign = rule.adjustmentPercent > 0 ? "Acréscimo" : "Desconto";
    return `${sign} de ${Math.abs(rule.adjustmentPercent).toLocaleString("pt-BR")}%`;
  }
  if (rule.negotiatedValue !== null) return brl(rule.negotiatedValue);
  if (rule.baseType !== "none" && rule.baseType !== "contract") {
    return `Fator ${rule.factor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }
  return "—";
}

/** Resumo de uma linha: referência · efeito. */
export function contractRuleHeadline(rule: ContractRule): string {
  return [contractRuleReference(rule), contractRuleEffect(rule)]
    .filter((part) => part !== "—")
    .join(" · ");
}

export function contractRuleSituationLabel(rule: Pick<ContractRule, "reviewed">): string {
  return rule.reviewed ? "Revisada" : "Pendente de revisão";
}

export interface RuleField {
  label: string;
  value: string;
  mono?: boolean;
}

/** Campos do resumo conforme o tipo da regra; só o que a extração guarda. */
export function contractRuleFields(rule: ContractRule): RuleField[] {
  const codes = parseRuleCodes(rule.codes);
  const fields: RuleField[] = [];
  if (codes.length > 0) fields.push({ label: "Código", value: codes.join(", "), mono: true });
  if (rule.baseType !== "none") {
    fields.push({ label: "Tabela", value: contractRuleBaseLabel(rule.baseType) });
  }
  if (rule.negotiatedValue !== null) {
    fields.push({ label: "Valor", value: brl(rule.negotiatedValue) });
  }
  if (rule.adjustmentPercent !== 0) {
    fields.push({
      label: rule.adjustmentPercent > 0 ? "Acréscimo" : "Desconto",
      value: `${Math.abs(rule.adjustmentPercent).toLocaleString("pt-BR")}%`,
    });
  }
  if (rule.factor !== 1)
    fields.push({ label: "Fator", value: rule.factor.toLocaleString("pt-BR") });
  return fields;
}

export function contractRuleApplication(rule: ContractRule): string {
  const codes = parseRuleCodes(rule.codes);
  if (codes.length > 0) {
    return `Somente ${codes.length === 1 ? "o código" : "os códigos"} ${codes.join(", ")}.`;
  }
  if (rule.category.trim()) return `Todos os itens da categoria ${rule.category.trim()}.`;
  return "Todos os itens do contrato.";
}

export function contractRuleRequiredData(rule: ContractRule): string[] {
  const items: string[] = [];
  if (parseRuleCodes(rule.codes).length > 0) items.push("Código do item faturado");
  else if (rule.category.trim()) items.push("Categoria do item faturado");
  if (rule.baseType !== "none" && rule.baseType !== "contract") {
    items.push(
      `Preço de referência na versão correspondente da ${contractRuleBaseLabel(rule.baseType)}`,
    );
  }
  items.push("Valor cobrado no faturamento");
  if (rule.validFrom || rule.validTo) items.push("Data do atendimento");
  return items;
}

export function contractRulePending(rule: ContractRule): string[] {
  const items: string[] = [];
  if (rule.baseType === "none") items.push("Tabela de referência não identificada no contrato.");
  if (rule.baseType === "contract" && rule.negotiatedValue === null) {
    items.push("Valor negociado não identificado no contrato.");
  }
  if (!rule.category.trim() && parseRuleCodes(rule.codes).length === 0) {
    items.push("Categoria ou código dos itens abrangidos não identificado.");
  }
  return items;
}

export function contractRuleValidity(rule: ContractRule): string {
  return formatContractRuleValidity(rule) || "—";
}

/** Data mais antiga de gravação entre as regras: o momento da extração. */
export function extractionDateOf(rules: ContractRule[]): string | null {
  const dates = rules.map((rule) => rule.createdAt).filter((date): date is string => !!date);
  return dates.length > 0 ? dates.sort()[0] : null;
}
