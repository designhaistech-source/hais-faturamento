import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { HOSPITALS, maskCpf, newUserSchema, type NewUserInput } from "../data/users";

interface NewUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEmails: string[];
  onCreate: (input: NewUserInput) => void;
  /** Quando informado, o modal entra em modo de edição com os dados atuais. */
  initialValues?: NewUserInput;
}

const EMPTY: NewUserInput = { name: "", email: "", cpf: "", hospitalId: "" };

export function NewUserModal({ open, onOpenChange, existingEmails, onCreate, initialValues }: NewUserModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewUserInput>({ resolver: zodResolver(newUserSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(initialValues ?? EMPTY);
  }, [open, reset, initialValues]);

  const editing = Boolean(initialValues);

  const submit = handleSubmit((data) => {
    const email = data.email.trim().toLowerCase();
    if (existingEmails.includes(email)) {
      setError("email", { message: "Já existe um usuário com este e-mail." });
      return;
    }
    onCreate({ ...data, name: data.name.trim(), email });
  });

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Editar usuário" : "Cadastrar usuário"}
      icon={<UserPlus className="size-5" aria-hidden="true" />}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="new-user-form" disabled={isSubmitting}>
            {editing ? "Salvar alterações" : "Cadastrar usuário"}
          </Button>
        </>
      }
    >
      <form id="new-user-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field id="user-name" label="Nome completo" required error={errors.name?.message} className="sm:col-span-2">
          <Input autoComplete="name" placeholder="Digite o nome completo" {...register("name")} />
        </Field>
        <Field id="user-email" label="E-mail" required error={errors.email?.message} className="sm:col-span-2">
          <Input type="email" autoComplete="email" placeholder="usuario@exemplo.com" {...register("email")} />
        </Field>
        <Controller
          control={control}
          name="cpf"
          render={({ field }) => (
            <Field id="user-cpf" label="CPF" error={errors.cpf?.message}>
              <Input
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={field.value}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(maskCpf(event.target.value))}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="hospitalId"
          render={({ field }) => (
            <SelectField
              id="user-hospital"
              label="Hospital"
              required
              placeholder="Selecione um hospital"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.hospitalId?.message}
              options={HOSPITALS.map((hospital) => ({ value: hospital.id, label: hospital.name }))}
            />
          )}
        />
      </form>
    </AppModal>
  );
}
