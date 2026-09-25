/** Pricing base versions persisted in the backend (table `pricing_versions` + storage bucket). */

/** Types of pricing base kept in parallel, each with its own version history. */
export const PRICING_BASE_TYPES = ["brasindice", "simpro", "cbhpm"] as const;

export type PricingBaseType = (typeof PRICING_BASE_TYPES)[number];

const PRICING_BASE_TYPE_LABELS: Record<PricingBaseType, string> = {
  brasindice: "Brasíndice",
  simpro: "SIMPRO",
  cbhpm: "CBHPM",
};

/** Label shown in the UI for a base type. */
export function pricingBaseTypeLabel(type: PricingBaseType): string {
  return PRICING_BASE_TYPE_LABELS[type];
}

/** Narrows a persisted value to a known base type, defaulting to Brasíndice. */
export function toPricingBaseType(value: string | null | undefined): PricingBaseType {
  return (PRICING_BASE_TYPES as readonly string[]).includes(value ?? "")
    ? (value as PricingBaseType)
    : "brasindice";
}

/**
 * Infers the base type from the file name while the modal has no explicit
 * selector for it (the form fields are adjusted separately).
 */
export function inferPricingBaseType(fileName: string): PricingBaseType {
  const normalized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (normalized.includes("simpro")) return "simpro";
  if (normalized.includes("cbhpm")) return "cbhpm";
  return "brasindice";
}

export interface PricingVersionFile {
  name: string;
  /** Storage path inside the `pricing-versions` bucket. */
  path: string;
  type: string;
}

export interface PricingVersion {
  id: string;
  /** ISO timestamp of the upload. */
  createdAt: string;
  createdBy: string;
  /** Reference month as "YYYY-MM"; empty for versions registered before this field existed. */
  versionMonth: string;
  baseType: PricingBaseType;
  file: PricingVersionFile;
  status: PricingVersionStatus;
  /** Plain-language explanation of what happened, when relevant. */
  statusProblem: string | null;
  /** What the user can do about it, when there is an action. */
  statusGuidance: string | null;
  processedCount: number | null;
  unprocessedCount: number | null;
  /** Reasons for the records that could not be processed, with counts. */
  unprocessedReasons: PricingUnprocessedReason[];
  retryable: boolean;
}

export interface PricingUnprocessedReason {
  reason: string;
  count: number;
}

export const PRICING_VERSION_STATUSES = [
  "PENDING",
  "PROCESSING",
  "EXTRACTED",
  "PARTIALLY_EXTRACTED",
  "INVALID_FILE",
  "PROCESSING_ERROR",
  "DUPLICATE_FILE",
] as const;

export type PricingVersionStatus = (typeof PRICING_VERSION_STATUSES)[number];

export function toPricingVersionStatus(value: string | null | undefined): PricingVersionStatus {
  return (PRICING_VERSION_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as PricingVersionStatus)
    : "PENDING";
}

/** Statuses that deserve the "Ver detalhes do processamento" action. */
export function hasProcessingDetails(version: PricingVersion): boolean {
  return (
    version.status === "PARTIALLY_EXTRACTED" ||
    version.status === "INVALID_FILE" ||
    version.status === "PROCESSING_ERROR" ||
    version.status === "DUPLICATE_FILE" ||
    Boolean(version.statusProblem)
  );
}

/** Data collected in the form before the version is persisted. */
export interface NewPricingVersionInput {
  file: File;
  /** Reference month, as "YYYY-MM". */
  /** Optional while the modal has no base type selector. */
  baseType?: PricingBaseType;
}

/** Formats "YYYY-MM" as "MM/AAAA"; "—" when absent. */
export function formatPricingVersionMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  return match ? `${match[2]}/${match[1]}` : "—";
}

/** Formats an ISO timestamp as "dd/MM/yyyy HH:mm" in the local timezone. */
export function formatVersionDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Ids of the newest successfully processed version of each base type ("Atual"), given versions ordered
 * from newest to oldest.
 */
export function currentVersionIdsByType(versions: PricingVersion[]): Set<string> {
  const current = new Map<PricingBaseType, string>();
  for (const version of versions) {
    // Only successfully processed versions can become "Atual".
    if (version.status !== "EXTRACTED") continue;
    if (!current.has(version.baseType)) current.set(version.baseType, version.id);
  }
  return new Set(current.values());
}
