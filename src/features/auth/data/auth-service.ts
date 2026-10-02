import { z } from "zod";

/**
 * Serviço de autenticação simulado (protótipo): contas fictícias em memória.
 * Nada é persistido; ao recarregar a página as senhas voltam ao estado inicial.
 */
interface MockAccount {
  cpf: string;
  email: string;
  /** `null` indica usuário cadastrado pelo administrador que ainda não definiu senha. */
  password: string | null;
}

const accounts: MockAccount[] = [
  { cpf: "123.456.789-09", email: "ana.souza@exemplo.com", password: "Senha@123" },
  { cpf: "987.654.321-00", email: "bruno.almeida@exemplo.com", password: null },
  { cpf: "321.654.987-11", email: "diego.ferreira@exemplo.com", password: "Senha@123" },
  { cpf: "456.789.123-22", email: "eduarda.lima@exemplo.com", password: null },
];

/** CPF aguardando a definição de senha do primeiro acesso (somente em memória). */
let pendingFirstAccessCpf: string | null = null;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type LoginResult = "success" | "first-access" | "invalid";

export async function login(cpf: string, password: string): Promise<LoginResult> {
  await wait(500);
  const account = accounts.find((item) => item.cpf === cpf);
  if (!account) return "invalid";
  if (account.password === null) {
    pendingFirstAccessCpf = account.cpf;
    return "first-access";
  }
  return account.password === password ? "success" : "invalid";
}

export function hasPendingFirstAccess(): boolean {
  return pendingFirstAccessCpf !== null;
}

export async function definePassword(password: string): Promise<void> {
  await wait(500);
  const account = accounts.find((item) => item.cpf === pendingFirstAccessCpf);
  if (!account) throw new Error("Sessão de primeiro acesso expirada.");
  account.password = password;
  pendingFirstAccessCpf = null;
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  await wait(500);
  const account = accounts.find((item) => item.email === email.trim().toLowerCase());
  return Boolean(account && account.password !== null);
}

/** Aplica a máscara 000.000.000-00 enquanto o usuário digita. */
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export const loginSchema = z.object({
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Informe um CPF completo."),
  password: z.string().min(1, "Informe sua senha."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const recoverSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido.")
    .max(255, "O e-mail deve ter até 255 caracteres."),
});
export type RecoverInput = z.infer<typeof recoverSchema>;

export const PASSWORD_RULES = [
  { id: "length", label: "Mínimo de 8 caracteres", test: (value: string) => value.length >= 8 },
  { id: "letter", label: "Pelo menos uma letra", test: (value: string) => /[A-Za-zÀ-ÿ]/.test(value) },
  { id: "number", label: "Pelo menos um número", test: (value: string) => /\d/.test(value) },
  {
    id: "special",
    label: "Pelo menos um caractere especial",
    test: (value: string) => /[^A-Za-zÀ-ÿ0-9\s]/.test(value),
  },
] as const;

export function meetsPasswordRules(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
