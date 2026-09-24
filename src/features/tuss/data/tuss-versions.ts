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
  /** TUSS table this file represents, as informed at registration. */
  tableName: string;
  /** ISO timestamp of the upload. */
  createdAt: string;
  createdBy: string;
  file: TussVersionFile;
}

export interface NewTussVersionInput {
  tableName: string;
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

/**
 * Ids of the newest file of each TUSS table ("Atual"), given newest-first order.
 * Registering a file only supersedes older files of the same table.
 */
export function currentTussTableIds(versions: TussVersion[]): Set<string> {
  const current = new Map<string, string>();
  for (const version of versions) {
    const key = version.tableName.trim().toLowerCase();
    if (!current.has(key)) current.set(key, version.id);
  }
  return new Set(current.values());
}

/**
 * Numbered TUSS tables offered in the registration select. Only the table number
 * is stored; each number keeps its own version history.
 */
export const TUSS_TABLE_NUMBERS = [
  "18",
  "19",
  "20",
  "22",
  ...Array.from({ length: 87 - 23 + 1 }, (_, index) => String(23 + index)),
] as const;

export function tussTableLabel(tableName: string): string {
  return /^\d+$/.test(tableName) ? `Tabela ${tableName}` : tableName || "—";
}
