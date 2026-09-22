import { getPdfWorker, loadPdfjs } from "../components/pdf-engine";
import { downloadContractBlob } from "./contracts-service";
import type { Contract } from "./contracts";

/** Limite de texto enviado para a leitura automática das regras. */
const MAX_TEXT_LENGTH = 60_000;

async function readPdfText(blob: Blob): Promise<string> {
  const [pdfjs, worker] = await Promise.all([loadPdfjs(), getPdfWorker()]);
  const data = new Uint8Array(await blob.arrayBuffer());
  const document = await pdfjs.getDocument({ data, worker }).promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(text);
    if (pages.join("\n").length > MAX_TEXT_LENGTH) break;
  }

  return pages.join("\n").slice(0, MAX_TEXT_LENGTH);
}

/** Texto do arquivo do contrato, usado na leitura automática das regras. */
export async function readContractText(contract: Contract): Promise<string> {
  const blob = await downloadContractBlob(contract.file.path);
  const isPdf =
    contract.file.type === "application/pdf" || contract.file.name.toLowerCase().endsWith(".pdf");

  const text = isPdf ? await readPdfText(blob) : (await blob.text()).slice(0, MAX_TEXT_LENGTH);
  return text.trim();
}
