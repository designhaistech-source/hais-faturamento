/** Consulta de valores de referência nas bases de precificação cadastradas (CSV). */

import {
  downloadPricingVersionBlob,
  listPricingVersions,
} from "@/features/pricing-base/data/pricing-versions-service";
import type { PricingBaseType, PricingVersion } from "@/features/pricing-base/data/pricing-versions";

import { parseNumber } from "./tiss-xml";

export interface PricingBaseLookup {
  version: PricingVersion;
  /** Valores de referência por código, já normalizados. */
  values: Map<string, number>;
}

const CODE_HEADERS = ["codigo", "cod", "tuss", "codtuss", "codigotuss", "codigoitem", "id"];
const VALUE_HEADERS = [
  "valor",
  "preco",
  "precounitario",
  "valorunitario",
  "pmc",
  "pfb",
  "porte",
  "valorreferencia",
];

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function detectDelimiter(line: string): string {
  const candidates = [";", ",", "\t", "|"];
  return candidates.reduce((best, candidate) =>
    line.split(candidate).length > line.split(best).length ? candidate : best,
  );
}

function splitLine(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

/** Chave usada na consulta: sem separadores e sem zeros à esquerda. */
export function normalizeCode(code: string): string {
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.replace(/^0+(?=\d)/, "");
}

/**
 * Lê um CSV de base de precificação identificando, pelo cabeçalho, a coluna do
 * código e a coluna do valor de referência.
 */
export function parsePricingCsv(content: string): Map<string, number> {
  const values = new Map<string, number>();
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return values;

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map(normalizeHeader);

  const codeIndex = headers.findIndex((header) =>
    CODE_HEADERS.some((candidate) => header === candidate || header.includes(candidate)),
  );
  const valueIndex = headers.findIndex((header) =>
    VALUE_HEADERS.some((candidate) => header === candidate || header.includes(candidate)),
  );
  if (codeIndex === -1 || valueIndex === -1) return values;

  for (const line of lines.slice(1)) {
    const cells = splitLine(line, delimiter);
    const code = normalizeCode(cells[codeIndex] ?? "");
    const value = parseNumber(cells[valueIndex] ?? "");
    if (code === "" || value === null) continue;
    if (!values.has(code)) values.set(code, value);
  }

  return values;
}

/**
 * Bases disponíveis para a análise: a versão mais recente de cada tipo, com o
 * CSV já lido. Bases sem versão cadastrada ficam ausentes do mapa.
 */
export async function loadPricingBases(): Promise<Map<PricingBaseType, PricingBaseLookup>> {
  const versions = await listPricingVersions();
  const latestByType = new Map<PricingBaseType, PricingVersion>();
  for (const version of versions) {
    if (!latestByType.has(version.baseType)) latestByType.set(version.baseType, version);
  }

  const bases = new Map<PricingBaseType, PricingBaseLookup>();
  for (const [baseType, version] of latestByType) {
    const blob = await downloadPricingVersionBlob(version.file.path);
    const values = parsePricingCsv(await blob.text());
    bases.set(baseType, { version, values });
  }
  return bases;
}
