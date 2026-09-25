import type { TussProcessingResult } from "./tuss-versions";

const TEXT_EXTENSIONS = /\.(csv|txt)$/i;
/** A TUSS row starts with the numeric term code. */
const CODE_LINE = /^\s*"?\d{5,10}"?\s*[;,|\t]/;

export async function sha256(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Reads every part and classifies the registration. Only text parts (CSV/TXT)
 * are inspected line by line; other formats are accepted as received.
 */
export async function analyzeTussFiles(
  files: { name: string; blob: Blob }[],
): Promise<TussProcessingResult> {
  let processed = 0;
  let unprocessed = 0;
  let inspected = false;

  for (const { name, blob } of files) {
    if (blob.size === 0) {
      return invalid(
        `O arquivo "${name}" está vazio.`,
        "Envie novamente o arquivo completo da tabela.",
      );
    }
    if (!TEXT_EXTENSIONS.test(name)) continue;
    inspected = true;
    const lines = (await blob.text()).split(/\r?\n/).filter((line) => line.trim() !== "");
    lines.forEach((line, index) => {
      if (CODE_LINE.test(line)) processed += 1;
      // The first line without a code is treated as the header.
      else if (index > 0) unprocessed += 1;
    });
  }

  if (inspected && processed === 0) {
    return invalid(
      "Nenhum registro da tabela TUSS foi reconhecido no conteúdo enviado.",
      "Verifique se o arquivo corresponde à tabela selecionada e se cada linha começa com o código do termo.",
    );
  }
  if (unprocessed > 0) {
    return {
      status: "PARTIALLY_EXTRACTED",
      problem: "Algumas linhas não puderam ser lidas e foram ignoradas.",
      guidance:
        "Confira as linhas sem código no início ou com formato diferente e cadastre o arquivo corrigido.",
      processedCount: processed,
      unprocessedCount: unprocessed,
      retryable: false,
    };
  }
  return {
    status: "EXTRACTED",
    problem: null,
    guidance: null,
    processedCount: inspected ? processed : null,
    unprocessedCount: inspected ? 0 : null,
    retryable: false,
  };
}

function invalid(problem: string, guidance: string): TussProcessingResult {
  return {
    status: "INVALID_FILE",
    problem,
    guidance,
    processedCount: null,
    unprocessedCount: null,
    retryable: false,
  };
}

export const PROCESSING_FAILURE: TussProcessingResult = {
  status: "PROCESSING_ERROR",
  problem: "Ocorreu uma falha inesperada durante o processamento dos arquivos.",
  guidance: "Tente reprocessar. Se o problema continuar, cadastre a tabela novamente.",
  processedCount: null,
  unprocessedCount: null,
  retryable: true,
};
