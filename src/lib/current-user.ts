/**
 * Usuário sintético usado pelos protótipos.
 * Não representa dados reais: serve apenas para preencher a interface.
 */
export interface CurrentUser {
  name: string;
  email: string;
  role: string;
}

export const CURRENT_USER: CurrentUser = {
  name: "Ana Souza",
  email: "ana.souza@haistech.example",
  role: "Faturamento",
};
