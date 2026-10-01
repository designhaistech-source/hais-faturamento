/**
 * Regras extraídas por arquivo — dados fictícios para demonstrar a estrutura da
 * página "Dados extraídos". Ainda não há extração por arquivo persistida.
 */
export type ExtractedRuleStatus = "active" | "expired" | "pending_review";

export interface ExtractedRule {
  id: string;
  type: string;
  target: string;
  condition: string;
  effect: string;
  /** yyyy-MM-dd */
  validFrom: string;
  /** yyyy-MM-dd; vazio quando sem data de término */
  validTo: string;
  status: ExtractedRuleStatus;
  sourceExcerpt: string;
}

const SAMPLE_RULES: Omit<ExtractedRule, "id">[] = [
  {
    type: "Medicamentos",
    target: "Brasíndice — PMC",
    condition: "Itens com preço de referência Brasíndice",
    effect: "Desconto de 10% sobre o PMC",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "active",
    sourceExcerpt: "Os medicamentos serão remunerados pelo PMC da Brasíndice com desconto de 10%.",
  },
  {
    type: "Materiais",
    target: "SIMPRO — PMC",
    condition: "Materiais descartáveis",
    effect: "Acréscimo de 5% sobre o PMC",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "active",
    sourceExcerpt: "Materiais descartáveis seguirão a tabela SIMPRO acrescida de 5%.",
  },
  {
    type: "Honorários",
    target: "CBHPM — porte",
    condition: "Procedimentos cirúrgicos eletivos",
    effect: "Fator 1,20 sobre o porte",
    validFrom: "2026-03-01",
    validTo: "",
    status: "pending_review",
    sourceExcerpt: "Os honorários médicos de cirurgias eletivas terão fator multiplicador de 1,20.",
  },
  {
    type: "Pacotes",
    target: "TUSS 31009336",
    condition: "Pacote de colecistectomia videolaparoscópica",
    effect: "Valor fixo de R$ 8.450,00",
    validFrom: "2025-07-01",
    validTo: "2025-12-31",
    status: "expired",
    sourceExcerpt: "Fica estabelecido o pacote de colecistectomia no valor de R$ 8.450,00.",
  },
  {
    type: "Diárias",
    target: "TUSS 60000589",
    condition: "Diária de apartamento",
    effect: "Valor fixo de R$ 620,00",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "active",
    sourceExcerpt: "A diária de apartamento será de R$ 620,00, incluindo taxas de enfermagem.",
  },
  {
    type: "Taxas",
    target: "Taxa de sala cirúrgica",
    condition: "Cirurgias de porte anestésico 3 ou superior",
    effect: "Acréscimo de 15%",
    validFrom: "2026-04-01",
    validTo: "",
    status: "pending_review",
    sourceExcerpt: "A taxa de sala para porte anestésico 3 ou superior terá acréscimo de 15%.",
  },
];

/** Quantidade e ordem variam por arquivo, de forma estável a partir do id. */
export function sampleExtractedRules(fileId: string): ExtractedRule[] {
  const seed = [...fileId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const count = 3 + (seed % (SAMPLE_RULES.length - 2));
  return Array.from({ length: count }, (_, index) => {
    const rule = SAMPLE_RULES[(seed + index) % SAMPLE_RULES.length];
    return { ...rule, id: `${fileId}-${index}` };
  });
}
