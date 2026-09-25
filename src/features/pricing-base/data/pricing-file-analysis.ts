/** Validates a pricing base file and counts which records can be read. */

import type { PricingUnprocessedReason } from "./pricing-versions";

export type PricingFileAnalysis =
  | { kind: "invalid"; problem: string; guidance: string }
  | {
      kind: "ok";
      processedCount: number;
      unprocessedCount: number;
      reasons: PricingUnprocessedReason[];
    };

const CODE_HEADERS = ["codigo", "cod", "tuss", "codtuss", "codigotuss", "codigoitem", "id"];
const VALUE_HEADERS = ["valor", "preco", "precounitario", "valorunitario", "pmc", "pfb", "porte", "valorreferencia"];

const REASON_MISSING_CODE = "Registro sem código";
const REASON_INVALID_VALUE = "Valor ausente ou em formato inválido";

function normalizeHeader(header: string): string {
  return header.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function detectDelimiter(line: string): string {
  return [";", ",", "\t", "|"].reduce((best, candidate) =>
    line.split(candidate).length > line.split(best).length ? candidate : best,
  );
}

function isValidNumber(raw: string): boolean {
  const cleaned = raw.trim().replace(/[R$\s]/g, "");
  if (cleaned === "") return false;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  return Number.isFinite(Number(normalized));
}

function summarize(missingCode: number, invalidValue: number, processed: number): PricingFileAnalysis {
  const reasons: PricingUnprocessedReason[] = [];
  if (missingCode > 0) reasons.push({ reason: REASON_MISSING_CODE, count: missingCode });
  if (invalidValue > 0) reasons.push({ reason: REASON_INVALID_VALUE, count: invalidValue });
  return { kind: "ok", processedCount: processed, unprocessedCount: missingCode + invalidValue, reasons };
}

const NO_RECORDS: PricingFileAnalysis = {
  kind: "invalid",
  problem: "Não foi possível identificar registros de código e valor no arquivo enviado.",
  guidance: "Verifique se o arquivo possui colunas de código e valor e envie um novo arquivo CSV ou TXT.",
};

export function analyzePricingContent(fileName: string, content: string): PricingFileAnalysis {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return {
      kind: "invalid",
      problem: "O arquivo enviado está vazio.",
      guidance: "Envie um novo arquivo com os registros da base de precificação.",
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(normalizeHeader);
  const codeIndex = headers.findIndex((h) => CODE_HEADERS.some((c) => h.includes(c)));
  const valueIndex = headers.findIndex((h) => VALUE_HEADERS.some((c) => h.includes(c)));

  let missingCode = 0;
  let invalidValue = 0;
  let processed = 0;

  if (codeIndex !== -1 && valueIndex !== -1) {
    for (const line of lines.slice(1)) {
      const cells = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""));
      if ((cells[codeIndex] ?? "").replace(/[^A-Za-z0-9]/g, "") === "") missingCode += 1;
      else if (!isValidNumber(cells[valueIndex] ?? "")) invalidValue += 1;
      else processed += 1;
    }
  } else if (fileName.toLowerCase().endsWith(".txt")) {
    // Positional TXT: code at the start, value at the end of each line.
    for (const line of lines) {
      const tokens = line.trim().split(/\s{2,}|\t/).filter((token) => token !== "");
      if (tokens.length < 2) {
        missingCode += 1;
        continue;
      }
      if (!isValidNumber(tokens[tokens.length - 1] ?? "")) invalidValue += 1;
      else processed += 1;
    }
  } else {
    return NO_RECORDS;
  }

  return processed === 0 ? NO_RECORDS : summarize(missingCode, invalidValue, processed);
}
