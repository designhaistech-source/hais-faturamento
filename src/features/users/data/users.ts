import { z } from "zod";

/** Usuário do sistema vinculado a um único hospital (relação 1:1 nesta versão). */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  hospitalId: string;
}

export interface Hospital {
  id: string;
  name: string;
}

/** Hospitais fictícios disponíveis para vínculo. */
export const HOSPITALS: Hospital[] = [
  { id: "h-santa-clara", name: "Hospital Santa Clara" },
  { id: "h-sao-lucas", name: "Hospital São Lucas" },
  { id: "h-boa-esperanca", name: "Hospital Boa Esperança" },
  { id: "h-vida-nova", name: "Hospital Vida Nova" },
];

/** Usuários fictícios iniciais. */
export const INITIAL_USERS: AppUser[] = [
  { id: "u1", name: "Ana Souza", email: "ana.souza@exemplo.com", cpf: "123.456.789-09", hospitalId: "h-santa-clara" },
  { id: "u2", name: "Bruno Almeida", email: "bruno.almeida@exemplo.com", cpf: "987.654.321-00", hospitalId: "h-sao-lucas" },
  { id: "u3", name: "Carla Mendes", email: "carla.mendes@exemplo.com", cpf: "", hospitalId: "h-boa-esperanca" },
  { id: "u4", name: "Diego Ferreira", email: "diego.ferreira@exemplo.com", cpf: "321.654.987-11", hospitalId: "h-vida-nova" },
  { id: "u5", name: "Eduarda Lima", email: "eduarda.lima@exemplo.com", cpf: "456.789.123-22", hospitalId: "h-santa-clara" },
];

export function hospitalName(id: string): string {
  return HOSPITALS.find((hospital) => hospital.id === id)?.name ?? "—";
}

/** Aplica a máscara 000.000.000-00 enquanto o usuário digita. */
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export const newUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome completo.")
    .max(120, "O nome deve ter até 120 caracteres."),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido.")
    .max(255, "O e-mail deve ter até 255 caracteres."),
  cpf: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value), "Informe um CPF completo."),
  hospitalId: z.string().min(1, "Selecione um hospital."),
});

export type NewUserInput = z.infer<typeof newUserSchema>;
