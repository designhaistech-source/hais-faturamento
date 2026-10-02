import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AuthLayout } from "./auth-layout";
import { PasswordInput } from "./password-input";
import { login, loginSchema, maskCpf, type LoginInput } from "../data/auth-service";

export function LoginPage() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { cpf: "", password: "" } });

  const submit = handleSubmit(async (data) => {
    setFailed(false);
    const result = await login(data.cpf, data.password);
    if (result === "first-access") {
      void navigate({ to: "/primeiro-acesso" });
      return;
    }
    if (result === "invalid") {
      setFailed(true);
      return;
    }
    toast.success("Login realizado com sucesso.");
    void navigate({ to: "/" });
  });

  return (
    <AuthLayout title="Boas-vindas ao HaisFaturamento" description="Acesse sua conta para continuar.">
      <form noValidate onSubmit={submit} className="space-y-4">
        <Controller
          control={control}
          name="cpf"
          render={({ field }) => (
            <Field id="login-cpf" label="CPF" error={errors.cpf?.message}>
              <Input
                inputMode="numeric"
                autoComplete="username"
                placeholder="000.000.000-00"
                value={field.value}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(maskCpf(event.target.value))}
              />
            </Field>
          )}
        />
        <div className="space-y-2">
          <Field id="login-password" label="Senha" error={errors.password?.message}>
            <PasswordInput autoComplete="current-password" placeholder="Digite sua senha" {...register("password")} />
          </Field>
          <Link
            to="/recuperar-senha"
            className="ml-auto block w-fit rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Esqueci minha senha
          </Link>
        </div>

        {failed && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertDescription>CPF ou senha incorretos. Confira os dados e tente novamente.</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
