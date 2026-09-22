/** Leitura dos itens faturados em um arquivo XML TISS. */

export interface TissItem {
  /** Ordem do item no arquivo, usada para identificar a linha no resultado. */
  lineNumber: number;
  code: string;
  description: string;
  quantity: number;
  unitValue: number | null;
  totalValue: number | null;
  /** Data de execução em yyyy-MM-dd, vazia quando o XML não informa. */
  executedAt: string;
  /** Categoria de cobrança inferida do XML (procedimentos, materiais, medicamentos…). */
  category: string;
}

/** Elementos do XML TISS que representam um item faturado. */
const ITEM_TAGS = new Set([
  "procedimentoExecutado",
  "procedimentosExecutados",
  "procExecutado",
  "despesa",
  "itemDespesa",
  "servicoExecutado",
  "outrasDespesas",
]);

const CODE_TAGS = [
  "codigoProcedimento",
  "codigoItem",
  "codigoServico",
  "codigoTabela",
  "codigo",
] as const;
const DESCRIPTION_TAGS = ["descricaoProcedimento", "descricaoItem", "descricao"] as const;
const QUANTITY_TAGS = ["quantidadeExecutada", "quantidade", "quantidadeSolicitada"] as const;
const UNIT_VALUE_TAGS = ["valorUnitario", "valorUnitarioTabela"] as const;
const TOTAL_VALUE_TAGS = ["valorTotal", "valorTotalItem"] as const;
const DATE_TAGS = ["dataExecucao", "dataRealizacao", "dataAtendimento", "dataInicio"] as const;
const EXPENSE_TYPE_TAGS = ["codigoDespesa", "tipoDespesa"] as const;

/** Categorias padronizadas do campo codigoDespesa do TISS. */
const EXPENSE_CATEGORIES: Record<string, string> = {
  "01": "materiais",
  "02": "medicamentos",
  "03": "taxas e diárias",
  "04": "gases medicinais",
  "05": "aluguéis",
  "07": "OPME",
  "08": "materiais",
  "09": "medicamentos",
};

function childValue(element: Element, tagNames: readonly string[]): string | null {
  for (const tagName of tagNames) {
    const found = Array.from(element.getElementsByTagName("*")).find(
      (child) => child.localName === tagName && (child.textContent?.trim() ?? "") !== "",
    );
    if (found) return found.textContent?.trim() ?? null;
  }
  return null;
}

/** Converte números no formato brasileiro ("1.234,56") ou internacional ("1234.56"). */
export function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s/g, "");
  if (normalized === "") return null;
  const hasComma = normalized.includes(",");
  const cleaned = hasComma
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized.replace(/,/g, "");
  const parsed = Number(cleaned.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value: string | null): string {
  if (!value) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(value);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return "";
}

function categoryOf(element: Element): string {
  const expenseType = childValue(element, EXPENSE_TYPE_TAGS);
  if (expenseType) {
    const code = expenseType.padStart(2, "0");
    if (EXPENSE_CATEGORIES[code]) return EXPENSE_CATEGORIES[code];
  }
  if (element.localName.toLowerCase().includes("proc")) return "procedimentos";
  return "";
}

/** Itens faturados do XML TISS, na ordem em que aparecem no arquivo. */
export function readTissItems(xml: Document): TissItem[] {
  const elements = Array.from(xml.getElementsByTagName("*")).filter((element) =>
    ITEM_TAGS.has(element.localName),
  );

  /** Ignora containers que apenas agrupam outros itens da mesma lista. */
  const leaves = elements.filter(
    (element) => !elements.some((other) => other !== element && element.contains(other)),
  );

  const items: TissItem[] = [];
  leaves.forEach((element, index) => {
    const code = childValue(element, CODE_TAGS) ?? "";
    const unitValue = parseNumber(childValue(element, UNIT_VALUE_TAGS));
    const totalValue = parseNumber(childValue(element, TOTAL_VALUE_TAGS));
    if (code === "" && unitValue === null && totalValue === null) return;

    const quantity = parseNumber(childValue(element, QUANTITY_TAGS)) ?? 1;
    items.push({
      lineNumber: index + 1,
      code,
      description: childValue(element, DESCRIPTION_TAGS) ?? "",
      quantity,
      unitValue,
      totalValue: totalValue ?? (unitValue !== null ? unitValue * quantity : null),
      executedAt: normalizeDate(childValue(element, DATE_TAGS)),
      category: categoryOf(element),
    });
  });

  return items;
}

/** XML TISS analisado; lança erro quando o arquivo não é um XML válido. */
export async function parseTissXml(file: File): Promise<Document> {
  const text = await file.text();
  const parsed = new DOMParser().parseFromString(text, "application/xml");
  if (parsed.getElementsByTagName("parsererror").length > 0) {
    throw new Error("O arquivo enviado não é um XML válido.");
  }
  return parsed;
}
