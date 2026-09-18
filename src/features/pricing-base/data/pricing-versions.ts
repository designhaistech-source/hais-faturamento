/** Pricing base versions persisted in the backend (table `pricing_versions` + storage bucket). */

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
  file: PricingVersionFile;
}

/** Data collected in the form before the version is persisted. */
export interface NewPricingVersionInput {
  file: File;
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
