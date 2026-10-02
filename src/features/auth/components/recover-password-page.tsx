import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";

import { Field } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthLayout } from "./auth-layout";
import { recoverSchema, requestPasswordReset, type RecoverInput } from "../data/auth-service";

export function RecoverPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverInput>({ resolver: zodResolver(recoverSchema), defaultValues: { email: "" } });

  const submit = handleSubmit(async (data) => {
    setNotFound(false);
    const ok = await requestPasswordReset(data.email);
    if (ok) setSentTo(data.email.trim().toLowerCase());
    else setNotFound(true);
  });

  const backLink = (
    <Button asChild variant="link" className="w-full">
      <Link to="/login">
        <ArrowLeft aria-hidden="true" />
        Voltar para o login
      </Link>
    </Button>
  );

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe seu e-mail cadastrado para receber as instruções de recuperação."
    >
      {sentTo ? (
        <div className="space-y-6 text-center" role="status">
          <MailCheck className="mx-auto size-10 text-success" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Enviamos as instruções de recuperação para{" "}
            <strong className="break-all text-foreground">{sentTo}</strong>.
          </p>
          {backLink}
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="space-y-4">
          <Field id="recover-email" label="E-mail" error={errors.email?.message}>
            <Input type="email" autoComplete="email" placeholder="usuario@exemplo.com" {...register("email")} />
          </Field>
          {notFound && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription>E-mail não encontrado. Confira o endereço informado.</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Enviar instruções
          </Button>
          {backLink}
        </form>
      )}
    </AuthLayout>
  );
}
