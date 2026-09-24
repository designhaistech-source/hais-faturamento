import {
  firstTagValue,
  formatCnpj,
  HEALTH_PLAN_ANS_TAGS,
  HEALTH_PLAN_TAGS,
  PROVIDER_CNPJ_TAGS,
  PROVIDER_TAGS,
} from "./billing-analyses";
import { readTissItems, type TissItem } from "./tiss-xml";

/** Dados do XML TISS apresentados na pré-visualização; null quando ausentes no arquivo. */
export interface XmlPreview {
  provider: string | null;
  providerCnpj: string | null;
  healthPlan: string | null;
  ansCode: string | null;
  batch: string | null;
  guide: string | null;
  date: string | null;
  items: TissItem[];
}

const BATCH_TAGS = ["numeroLote"] as const;
const GUIDE_TAGS = ["numeroGuiaPrestador", "numeroGuiaOperadora", "numeroGuia"] as const;
const DATE_TAGS = ["competencia", "dataEnvioLote", "dataRegistroTransacao", "dataEmissao"] as const;

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const month = /^(\d{4})(\d{2})$/.exec(value);
  if (month) return `${month[2]}/${month[1]}`;
  return value;
}

export function parseXmlText(text: string): Document {
  const parsed = new DOMParser().parseFromString(text, "application/xml");
  if (parsed.getElementsByTagName("parsererror").length > 0) {
    throw new Error("O arquivo XML não pôde ser lido.");
  }
  return parsed;
}

export function buildXmlPreview(text: string): XmlPreview {
  const xml = parseXmlText(text);
  const cnpj = firstTagValue(xml, PROVIDER_CNPJ_TAGS);
  return {
    provider: firstTagValue(xml, PROVIDER_TAGS),
    providerCnpj: cnpj ? (formatCnpj(cnpj) ?? cnpj) : null,
    healthPlan: firstTagValue(xml, HEALTH_PLAN_TAGS),
    ansCode: firstTagValue(xml, HEALTH_PLAN_ANS_TAGS),
    batch: firstTagValue(xml, BATCH_TAGS),
    guide: firstTagValue(xml, GUIDE_TAGS),
    date: formatDate(firstTagValue(xml, DATE_TAGS)),
    items: readTissItems(xml),
  };
}

/** Reindenta o XML com 2 espaços, preservando o conteúdo textual. */
export function formatXml(text: string): string {
  const compact = text.replace(/>\s+</g, "><").trim();
  const tokens = compact.split(/(?=<)|(?<=>)/g).filter((token) => token.trim() !== "");
  let depth = 0;
  const lines: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.startsWith("</")) {
      depth = Math.max(depth - 1, 0);
      lines.push("  ".repeat(depth) + token);
    } else if (
      token.startsWith("<") &&
      !token.startsWith("<?") &&
      !token.startsWith("<!") &&
      !token.endsWith("/>")
    ) {
      const text = tokens[i + 1];
      const close = tokens[i + 2];
      if (text && !text.startsWith("<") && close?.startsWith("</")) {
        lines.push("  ".repeat(depth) + token + text + close);
        i += 2;
      } else {
        lines.push("  ".repeat(depth) + token);
        depth += 1;
      }
    } else {
      lines.push("  ".repeat(depth) + token);
    }
  }
  return lines.join("\n");
}

export function downloadXml(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
