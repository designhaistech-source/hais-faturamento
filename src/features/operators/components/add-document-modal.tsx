import { useState } from "react";
import { FileText } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  ContractFileDropzone,
  useCreateAmendment,
  useCreateContract,
  validateContractFile,
} from "@/features/contracts";
import type { Operator } from "../data/operators";

interface AddContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Operadoras já com o contrato real resolvido (`contractId`). */
  operators: Operator[];
}

/**
 * Cadastro global de documento contratual: sem contrato, vira o contrato original;
 * com contrato, entra na mesma relação contratual como aditivo.
 */
export function AddContractModal({ open, onOpenChange, operators }: AddContractModalProps) {
  const [operatorId, setOperatorId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const createContract = useCreateContract();
  const createAmendment = useCreateAmendment();

  const operator = operators.find((item) => item.id === operatorId);
  const pending = createContract.isPending || createAmendment.isPending;
  const canSubmit = Boolean(operator && file) && !pending;

  function selectFile(selected: File | null) {
    const error = selected ? validateContractFile(selected) : null;
    setFileError(error ?? undefined);
    setFile(error ? null : selected);
  }

  function close() {
    setOperatorId("");
    setFile(null);
    setFileError(undefined);
    onOpenChange(false);
  }

  function submit() {
    if (!canSubmit || !operator || !file) return;
    if (operator.contractId) {
      createAmendment.mutate({
        contract: { id: operator.contractId, company: operator.name },
        file,
      });
    } else {
      createContract.mutate({ company: operator.name, cnpj: "", validUntil: "", file });
    }
    close();
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Adicionar contrato"
      description="Adicione um contrato vinculado a uma operadora."
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
        <SelectField
          id="contract-operator"
          label="Operadora"
          required
          placeholder="Selecione"
          options={operators.map((item) => ({ value: item.id, label: item.name }))}
          value={operatorId}
          onValueChange={setOperatorId}
        />

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
