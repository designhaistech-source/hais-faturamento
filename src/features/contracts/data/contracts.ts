/** Contract records persisted in the backend (table `contracts` + storage bucket). */

export interface ContractFile {
  name: string;
  /** Storage path of the uploaded file inside the `contracts` bucket. */
  path: string;
  type: string;
}

export interface Contract {
  id: string;
  company: string;
  /** Raw digits are never stored: the value is kept as typed/masked. */
  cnpj: string;
  /** yyyy-MM-dd, empty when not informed. */
  validUntil: string;
  file: ContractFile;
}

/** Data collected in the form before the contract is persisted. */
export interface NewContractInput {
  company: string;
  cnpj: string;
  validUntil: string;
  file: File;
}

/** Applies the 00.000.000/0000-00 mask while the user types. */
export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];

  let masked = parts[0];
  if (parts[1]) masked += `.${parts[1]}`;
  if (parts[2]) masked += `.${parts[2]}`;
  if (parts[3]) masked += `/${parts[3]}`;
  if (parts[4]) masked += `-${parts[4]}`;
  return masked;
}
