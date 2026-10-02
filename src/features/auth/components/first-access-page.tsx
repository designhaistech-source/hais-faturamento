import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AuthLayout } from "./auth-layout";
import { PasswordInput } from "./password-input";
import { PASSWORD_RULES, definePassword, hasPendingFirstAccess, meetsPasswordRules } from "../data/auth-service";

export function FirstAccessPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  // Sem um login de primeiro acesso em andamento, volta para o login.
  useEffect(() => {
    if (!hasPendingFirstAccess() && !done) void navigate({ to: "/login", replace: true });
  }, [navigate, done]);

  const mismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit = meetsPasswordRules(password) && password === confirmation && !pending;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      await definePassword(password);
      setDone(true);
      toast.success("Senha definida com sucesso.");
    } catch {
      toast.error("Não foi possível definir a senha. Faça login novamente.");
      void navigate({ to: "/login" });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Senha definida" description="Sua senha foi criada com sucesso.">
        <div className="space-y-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Acesse o HaisFaturamento com seu CPF e a senha criada.</p>
          <Button type="button" className="w-full" onClick={() => void navigate({ to: "/login" })}>
            Ir para o login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Primeiro acesso" description="Defina uma senha para acessar sua conta.">
      <form noValidate onSubmit={submit} className="space-y-4">
        <Field id="first-access-password" label="Nova senha">
          <PasswordInput
            autoComplete="new-password"
            aria-describedby="password-rules"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>


        <Field
          id="first-access-confirmation"
          label="Confirme sua senha"
          error={mismatch ? "As senhas não coincidem." : undefined}
        >
          <PasswordInput
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </Field>

        <ul id="password-rules" aria-live="polite" className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li
                key={rule.id}
                className={cn("flex items-center gap-2 text-sm", ok ? "text-success" : "text-muted-foreground")}
              >
                {ok ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <X className="size-4 shrink-0" aria-hidden="true" />}
                <span>{rule.label}</span>
                <span className="sr-only">{ok ? "(atendido)" : "(pendente)"}</span>
              </li>
            );
          })}
        </ul>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Definir senha
        </Button>
      </form>
    </AuthLayout>
  );
}
