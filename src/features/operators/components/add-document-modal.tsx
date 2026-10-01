import { useState } from "react";
import { FileText } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractFileDropzone, useCreateContract, validateContractFile } from "@/features/contracts";
import type { Operator } from "../data/operators";

interface AddContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Operadoras já com o contrato real resolvido (`contractId`). */
  operators: Operator[];
}

/** Cadastro global de contrato para operadoras que ainda não têm contrato. */
export function AddContractModal({ open, onOpenChange, operators }: AddContractModalProps) {
  const [operatorId, setOperatorId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const createContract = useCreateContract();

  const available = operators.filter((operator) => !operator.contractId);
  const operator = available.find((item) => item.id === operatorId);
  const canSubmit = Boolean(operator && file) && !createContract.isPending;

  function selectFile(selected: File | null) {
    const error = selected ? validateContractFile(selected) : null;
    setFileError(error ?? undefined);
    setFile(error ? null : selected);
  }

  function close() {
    setOperatorId("");
    setValidUntil("");
    setFile(null);
    setFileError(undefined);
    onOpenChange(false);
  }

  function submit() {
    if (!canSubmit || !operator || !file) return;
    createContract.mutate({ company: operator.name, cnpj: "", validUntil, file });
    close();
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Adicionar contrato"
      description="Cadastre o contrato do hospital com uma operadora."
      icon={<FileText className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={!canSubmit} onClick={submit}>
            Adicionar
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="contract-operator"
            label="Operadora"
            required
            placeholder={available.length === 0 ? "Nenhuma operadora disponível" : "Selecione"}
            disabled={available.length === 0}
            options={available.map((item) => ({ value: item.id, label: item.name }))}
            value={operatorId}
            onValueChange={setOperatorId}
          />
          <Field id="contract-valid-until" label="Data de validade do contrato">
            <Input
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </Field>
        </div>

        <Field
          id="contract-file"
          label="Arquivo"
          required
          error={fileError}
          hint="PDF, DOC ou DOCX · Máx. 10 MB"
          injectChildProps={false}
        >
          <ContractFileDropzone inputId="contract-file" file={file} onSelect={selectFile} />
        </Field>
      </form>
    </AppModal>
  );
}
