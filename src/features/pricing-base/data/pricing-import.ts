/**
 * Leitura simulada de um arquivo de base de precificação para o protótipo. As regras de
 * estrutura e validação de Brasíndice, SIMPRO e CBHPM pertencem ao backend; aqui o arquivo
 * é sempre aceito e as linhas são apenas listadas (colunas reconhecidas pelo cabeçalho,
 * quando houver). Os demais status vêm só dos controles temporários de simulação.
 */

import type { PricingBaseType } from "./pricing-versions";

export const IMPORT_STATUSES = [
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "NOT_SUPPORTED",
  "INVALID_FORMAT",
  "FAILED",
] as const;

export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export type ImportField = "description" | "code" | "tiss" | "tuss" | "ean" | "price";

export interface ImportedRecord {
  line: number;
  /** Conteúdo original da linha. */
  content: string;
  /** Arquivo de origem quando a versão é composta por vários arquivos. */
  file?: string;
  values: Partial<Record<ImportField, string>>;
}

export interface ImportErrorRow {
  line: number;
  /** Arquivo de origem quando a versão é composta por vários arquivos. */
  file?: string;
  reason: string;
  content: string;
}

export interface PricingImportResult {
  status: ImportStatus;
  /** Motivo quando a importação não pôde ser feita (NOT_SUPPORTED, INVALID_FORMAT, FAILED). */
  problem: string | null;
  /** Colunas reconhecidas no arquivo, na ordem de exibição. */
  fields: ImportField[];
  records: ImportedRecord[];
  errors: ImportErrorRow[];
  /** Total de linhas de dados lidas (sem o cabeçalho). */
  totalLines: number;
}

const FIELD_ALIASES: Record<ImportField, string[]> = {
  description: ["medicamento", "descricao", "produto", "nome", "item", "procedimento"],
  tiss: ["tiss", "codigotiss", "codtiss"],
  tuss: ["tuss", "codigotuss", "codtuss"],
  ean: ["ean", "codigodebarras", "codigobarras", "gtin"],
  price: [
    "preco",
    "valor",
    "precounitario",
    "valorunitario",
    "pmc",
    "pfb",
    "porte",
    "valorreferencia",
  ],
  code: ["codigo", "cod", "codigoitem", "id"],
};

const DISPLAY_ORDER: ImportField[] = ["description", "code", "tiss", "tuss", "ean", "price"];

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function detectDelimiter(line: string): string | null {
  const candidates = [";", ",", "\t", "|"];
  const best = candidates.reduce((current, candidate) =>
    line.split(candidate).length > line.split(current).length ? candidate : current,
  );
  return line.split(best).length > 1 ? best : null;
}

function splitLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

/** Mapeia cada campo conhecido para a primeira coluna do cabeçalho que o representa. */
function mapColumns(headers: string[]): Partial<Record<ImportField, number>> {
  const normalized = headers.map(normalizeHeader);
  const used = new Set<number>();
  const columns: Partial<Record<ImportField, number>> = {};
  // Campos específicos antes do genérico "código", que também casaria com "codigotiss".
  for (const field of ["tiss", "tuss", "ean", "price", "description", "code"] as ImportField[]) {
    const index = normalized.findIndex(
      (header, position) =>
        !used.has(position) &&
        FIELD_ALIASES[field].some((alias) =>
          field === "code" ? header === alias : header === alias || header.includes(alias),
        ),
    );
    if (index !== -1) {
      columns[field] = index;
      used.add(index);
    }
  }
  return columns;
}

function failure(status: ImportStatus, problem: string): PricingImportResult {
  return { status, problem, fields: [], records: [], errors: [], totalLines: 0 };
}

/** Lista as linhas do arquivo; nunca rejeita conteúdo. Linha 1 é o cabeçalho. */
export function parsePricingImport(content: string): PricingImportResult {
  const rawLines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerIndex = rawLines.findIndex((line) => line.trim() !== "");
  const delimiter = headerIndex === -1 ? null : detectDelimiter(rawLines[headerIndex]);
  const columns = delimiter ? mapColumns(splitLine(rawLines[headerIndex], delimiter)) : {};
  const fields = DISPLAY_ORDER.filter((field) => columns[field] !== undefined);
  const records: ImportedRecord[] = [];

  rawLines.forEach((raw, index) => {
    if (index <= headerIndex || raw.trim() === "") return;
    const values: Partial<Record<ImportField, string>> = {};
    if (delimiter) {
      const cells = splitLine(raw, delimiter);
      for (const field of fields) values[field] = cells[columns[field] ?? -1] ?? "";
    }
    records.push({ line: index + 1, content: raw.trim(), values });
  });

  return {
    status: "COMPLETED",
    problem: null,
    fields,
    records,
    errors: [],
    totalLines: records.length,
  };
}

/** Rótulos das colunas do modal, conforme o tipo de base. */
export function importFieldLabel(field: ImportField, baseType: PricingBaseType): string {
  switch (field) {
    case "description":
      return baseType === "brasindice" ? "Medicamento" : "Descrição";
    case "code":
      return "Código";
    case "tiss":
      return "TISS";
    case "tuss":
      return "TUSS";
    case "ean":
      return "EAN";
    case "price":
      return "Preço";
  }
}

export const IMPORT_STATUS_LABEL: Record<ImportStatus, string> = {
  COMPLETED: "Concluído",
  COMPLETED_WITH_ERRORS: "Concluído com erros",
  NOT_SUPPORTED: "Não suportado",
  INVALID_FORMAT: "Formato inválido",
  FAILED: "Falha na importação",
};

export function isKnownImportStatus(value: string | null | undefined): value is ImportStatus {
  return (IMPORT_STATUSES as readonly string[]).includes(value ?? "");
}

/** Registros anteriores aos status de importação ("EXTRACTED") contam como concluídos. */
export function toImportStatus(value: string | null | undefined): ImportStatus {
  return isKnownImportStatus(value) ? value : "COMPLETED";
}

/**
 * Processa um conjunto de arquivos como uma única versão: qualquer arquivo que impeça a
 * importação define o status do conjunto; caso contrário, registros e erros são somados.
 */
export function parsePricingImportSet(
  parts: ReadonlyArray<{ name: string; content: string }>,
): PricingImportResult {
  if (parts.length === 1) return parsePricingImport(parts[0].content);
  // failure() stays for simulated blocking statuses of a single part.
  const tag = (name: string) => ({ file: name });
  const fields = new Set<ImportField>();
  const records: ImportedRecord[] = [];
  const errors: ImportErrorRow[] = [];
  let totalLines = 0;
  for (const part of parts) {
    const result = parsePricingImport(part.content);
    if (result.problem !== null) {
      return failure(result.status, `${part.name}: ${result.problem}`);
    }
    result.fields.forEach((field) => fields.add(field));
    records.push(...result.records.map((record) => ({ ...record, ...tag(part.name) })));
    errors.push(...result.errors.map((row) => ({ ...row, ...tag(part.name) })));
    totalLines += result.totalLines;
  }
  return {
    status: errors.length > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
    problem: null,
    fields: DISPLAY_ORDER.filter((field) => fields.has(field)),
    records,
    errors,
    totalLines,
  };
}

/** Status que só podem ser obtidos pelos controles temporários de simulação. */
export const SIMULATED_IMPORT_STATUSES = [
  "COMPLETED_WITH_ERRORS",
  "NOT_SUPPORTED",
  "INVALID_FORMAT",
  "FAILED",
] as const satisfies readonly ImportStatus[];

export type SimulatedImportStatus = (typeof SIMULATED_IMPORT_STATUSES)[number];

const SIMULATED_PROBLEM: Record<Exclude<SimulatedImportStatus, "COMPLETED_WITH_ERRORS">, string> = {
  NOT_SUPPORTED: "Simulação temporária: o backend informaria aqui por que o arquivo não é suportado.",
  INVALID_FORMAT: "Simulação temporária: o backend informaria aqui por que o formato é inválido.",
  FAILED: "Simulação temporária: o backend informaria aqui a falha inesperada da importação.",
};

/**
 * Temporário (somente desenvolvimento/testes): aplica um status simulado sobre o resultado
 * normal, sem inferir nada do conteúdo. Com erros, marca linhas reais como rejeitadas.
 */
export function simulateImportResult(
  result: PricingImportResult,
  status: SimulatedImportStatus,
): PricingImportResult {
  if (status !== "COMPLETED_WITH_ERRORS") return failure(status, SIMULATED_PROBLEM[status]);
  const rejected = result.records.filter((_, index) => index % 2 === 1 || result.records.length === 1);
  const rejectedSet = new Set(rejected);
  return {
    ...result,
    status,
    records: result.records.filter((record) => !rejectedSet.has(record)),
    errors: rejected.map((record) => ({
      line: record.line,
      content: record.content,
      reason: "Simulação temporária: o backend informaria aqui o motivo do erro desta linha.",
      ...(record.file ? { file: record.file } : {}),
    })),
  };
}
