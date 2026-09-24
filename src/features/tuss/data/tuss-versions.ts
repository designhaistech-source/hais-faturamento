/** TUSS set versions persisted in the backend (table `tuss_versions` + storage bucket). */

export interface TussVersionFile {
  name: string;
  /** Storage path inside the `tuss-versions` bucket. */
  path: string;
  type: string;
}

export interface TussVersion {
  id: string;
  /** Reference month of the version, as "YYYY-MM". */
  versionMonth: string;
  /** ISO timestamp of the upload. */
  createdAt: string;
  createdBy: string;
  file: TussVersionFile;
}

export interface NewTussVersionInput {
  /** Reference month, as "YYYY-MM". */
  versionMonth: string;
  file: File;
}

/** Formats "YYYY-MM" (or a date starting with it) as "MM/AAAA". */
export function formatVersionMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  return match ? `${match[2]}/${match[1]}` : value;
}

/** Formats an ISO timestamp as "dd/MM/yyyy HH:mm" in the local timezone. */
export function formatTussDateTime(iso: string): string {
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

/** The newest registered version is the one in use ("Atual"). Expects newest-first order. */
export function currentTussVersionId(versions: TussVersion[]): string | undefined {
  return versions[0]?.id;
}
