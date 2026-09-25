/**
 * Importação de um arquivo de base de precificação (CSV/TXT delimitado):
 * identifica as colunas pelo cabeçalho, valida linha a linha e classifica o
 * resultado nos status de importação.
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
  /** Arquivo de origem quando a versão é composta por vários arquivos. */
  file?: string;
  /** Conteúdo bruto da linha, quando as colunas não foram reconhecidas. */
  content?: string;
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

const PRICE_PATTERN = /^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?$|^-?\d+(?:\.\d+)?$/;

function validateRow(
  values: Partial<Record<ImportField, string>>,
  seenKeys: Map<string, number>,
  keyField: "tiss" | "code",
  line: number,
): string | null {
  const price = values.price ?? "";
  if (price === "") return "O preço está vazio.";
  if (!PRICE_PATTERN.test(price.replace(/^R\$\s*/, ""))) {
    return `Valor inválido "${price}" no campo preço.`;
  }

  const key = values[keyField] ?? "";
  if (keyField === "tiss") {
    if (key === "") return "O código TISS está vazio.";
    if (!/^\d+$/.test(key)) return `Valor inválido "${key}" no campo TISS.`;
    if (key.length !== 10) return `O código TISS "${key}" precisa ter 10 dígitos.`;
  } else if (key === "") {
    return "O código está vazio.";
  }

  const tuss = values.tuss ?? "";
  if (tuss !== "" && !/^\d{8}$/.test(tuss)) return `Valor inválido "${tuss}" no campo TUSS.`;

  const ean = values.ean ?? "";
  if (ean !== "" && !/^\d{8,14}$/.test(ean)) return `Valor inválido "${ean}" no campo EAN.`;

  const previous = seenKeys.get(key);
  if (previous !== undefined) {
    return keyField === "tiss"
      ? `O código TISS ${key} já apareceu na linha ${previous}.`
      : `O código ${key} já apareceu na linha ${previous}.`;
  }
  seenKeys.set(key, line);
  return null;
}

function failure(status: ImportStatus, problem: string): PricingImportResult {
  return { status, problem, fields: [], records: [], errors: [], totalLines: 0 };
}

/**
 * Simulação do protótipo: as regras que definem cada status (NOT_SUPPORTED, INVALID_FORMAT,
 * FAILED etc.) pertencem ao backend. Quando ele devolver status e motivos, este parser deixa
 * de decidir e a interface apenas exibe o que for retornado.
 */
/** Lê e valida o conteúdo do arquivo. Números de linha contam a partir do cabeçalho (linha 1). */
export function parsePricingImport(
  content: string,
  baseType: PricingBaseType = "brasindice",
): PricingImportResult {
  if (baseType === "simpro") return parseSimproImport(content);
  if (baseType === "cbhpm") return parseUndefinedLayout(content);
  return parseBrasindiceImport(content);
}

/** Layout SIMPRO definido para o protótipo, na ordem do arquivo. */
const SIMPRO_LAYOUT: ReadonlyArray<{ header: string; field: ImportField | null }> = [
  { header: "CD_SIMPRO", field: "code" },
  { header: "CODIGO_TUSS", field: "tuss" },
  { header: "DESCRICAO", field: "description" },
  { header: "TIPO_PRECO", field: null },
  { header: "VALOR", field: "price" },
];

/**
 * SIMPRO: reconhece somente o layout definido. Nenhuma validação por linha foi definida
 * para esta base, então cada linha de dados é importada como está.
 */
function parseSimproImport(content: string): PricingImportResult {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim() !== "");
  if (headerIndex === -1) return failure("INVALID_FORMAT", "O arquivo está vazio.");
  const delimiter = detectDelimiter(lines[headerIndex]);
  if (!delimiter) {
    return failure(
      "INVALID_FORMAT",
      "Não foi possível identificar o separador de colunas na primeira linha do arquivo.",
    );
  }
  const headers = splitLine(lines[headerIndex], delimiter).map((header) => header.toUpperCase());
  const missing = SIMPRO_LAYOUT.filter(({ header }) => !headers.includes(header)).map(
    ({ header }) => header,
  );
  if (missing.length > 0) {
    return failure(
      "NOT_SUPPORTED",
      `Layout SIMPRO não reconhecido. Colunas esperadas: ${SIMPRO_LAYOUT.map(({ header }) => header).join(" | ")}. Não encontrada${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`,
    );
  }
  const columns = SIMPRO_LAYOUT.filter(
    (column): column is { header: string; field: ImportField } => column.field !== null,
  ).map(({ header, field }) => ({ field, index: headers.indexOf(header) }));
  const records: ImportedRecord[] = [];
  lines.forEach((raw, index) => {
    if (index <= headerIndex || raw.trim() === "") return;
    const cells = splitLine(raw, delimiter);
    const values: Partial<Record<ImportField, string>> = {};
    for (const { field, index: column } of columns) values[field] = cells[column] ?? "";
    records.push({ line: index + 1, values });
  });
  return {
    status: "COMPLETED",
    problem: null,
    fields: DISPLAY_ORDER.filter((field) => columns.some((column) => column.field === field)),
    records,
    errors: [],
    totalLines: records.length,
  };
}

/** Bases sem layout definido no protótipo (CBHPM): nenhuma regra é presumida. */
function parseUndefinedLayout(content: string): PricingImportResult {
  const records: ImportedRecord[] = [];
  content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .forEach((raw, index) => {
      if (raw.trim() !== "") records.push({ line: index + 1, content: raw.trim(), values: {} });
    });
  return {
    status: "COMPLETED",
    problem: null,
    fields: [],
    records,
    errors: [],
    totalLines: records.length,
  };
}

/** Brasíndice: layout e validações simuladas do protótipo. */
function parseBrasindiceImport(content: string): PricingImportResult {
  if (content.includes("\u0000")) {
    return failure("INVALID_FORMAT", "O conteúdo do arquivo não é texto delimitado (CSV/TXT).");
  }
  const rawLines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerIndex = rawLines.findIndex((line) => line.trim() !== "");
  if (headerIndex === -1) return failure("INVALID_FORMAT", "O arquivo está vazio.");

  const delimiter = detectDelimiter(rawLines[headerIndex]);
  if (!delimiter) {
    return failure(
      "INVALID_FORMAT",
      "Não foi possível identificar o separador de colunas na primeira linha do arquivo.",
    );
  }

  const columns = mapColumns(splitLine(rawLines[headerIndex], delimiter));
  const keyField: "tiss" | "code" | null =
    columns.tiss !== undefined ? "tiss" : columns.code !== undefined ? "code" : null;
  const missing = [
    keyField === null ? "código (TISS ou código do item)" : null,
    columns.price === undefined ? "preço" : null,
  ].filter((value): value is string => value !== null);
  if (keyField === null || missing.length > 0) {
    return failure(
      "NOT_SUPPORTED",
      `Layout não suportado: coluna${missing.length > 1 ? "s" : ""} obrigatória${missing.length > 1 ? "s" : ""} não encontrada${missing.length > 1 ? "s" : ""} no cabeçalho: ${missing.join(", ")}.`,
    );
  }

  const fields = DISPLAY_ORDER.filter((field) => columns[field] !== undefined);
  const records: ImportedRecord[] = [];
  const errors: ImportErrorRow[] = [];
  const seenKeys = new Map<string, number>();
  let totalLines = 0;

  rawLines.forEach((raw, index) => {
    if (index <= headerIndex || raw.trim() === "") return;
    totalLines += 1;
    const line = index + 1;
    const cells = splitLine(raw, delimiter);
    const values: Partial<Record<ImportField, string>> = {};
    for (const field of fields) values[field] = cells[columns[field] ?? -1] ?? "";
    const reason = validateRow(values, seenKeys, keyField, line);
    if (reason) errors.push({ line, reason, content: raw.trim() });
    else records.push({ line, values });
  });

  if (totalLines === 0) {
    return failure("INVALID_FORMAT", "O arquivo não contém linhas de dados após o cabeçalho.");
  }

  return {
    status: errors.length > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
    problem: null,
    fields,
    records,
    errors,
    totalLines,
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

/** Status fora dos cinco válidos (ex.: legado "EXTRACTED") ficam nulos: dado legado, nunca Concluído. */
export function toImportStatus(value: string | null | undefined): ImportStatus | null {
  return isKnownImportStatus(value) ? value : null;
}

/**
 * Processa um conjunto de arquivos como uma única versão: qualquer arquivo que impeça a
 * importação define o status do conjunto; caso contrário, registros e erros são somados.
 */
export function parsePricingImportSet(
  parts: ReadonlyArray<{ name: string; content: string }>,
  baseType: PricingBaseType = "brasindice",
): PricingImportResult {
  if (parts.length === 1) return parsePricingImport(parts[0].content, baseType);
  const tag = (name: string) => ({ file: name });
  const fields = new Set<ImportField>();
  const records: ImportedRecord[] = [];
  const errors: ImportErrorRow[] = [];
  let totalLines = 0;
  for (const part of parts) {
    const result = parsePricingImport(part.content, baseType);
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
