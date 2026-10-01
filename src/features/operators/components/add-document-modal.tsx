import { useState } from "react";
import { FileText } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContractFileDropzone,
  useCreateAmendment,
  useCreateContract,
  validateContractFile,
} from "@/features/contracts";
import type { Operator } from "../data/operators";

type DocumentType = "contract" | "amendment";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "contract", label: "Contrato" },
  { value: "amendment", label: "Aditivo" },
];

interface AddDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Operadoras já com o contrato real resolvido (`contractId`). */
  operators: Operator[];
}

/** Cadastro global: contrato para operadoras sem contrato, aditivo para as que já têm. */
export function AddDocumentModal({ open, onOpenChange, operators }: AddDocumentModalProps) {
  const [type, setType] = useState<DocumentType | "">("");
  const [operatorId, setOperatorId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const createContract = useCreateContract();
  const createAmendment = useCreateAmendment();

  const available = operators.filter((operator) =>
    type === "contract" ? !operator.contractId : type === "amendment" && !!operator.contractId,
  );
  const operator = available.find((item) => item.id === operatorId);
  const pending = createContract.isPending || createAmendment.isPending;
  const canSubmit = Boolean(type && operator && file) && !pending;

  function selectFile(selected: File | null) {
    const error = selected ? validateContractFile(selected) : null;
    setFileError(error ?? undefined);
    setFile(error ? null : selected);
  }

  function close() {
    setType("");
    setOperatorId("");
    setValidUntil("");
    setFile(null);
    setFileError(undefined);
    onOpenChange(false);
  }

  function submit() {
    if (!canSubmit || !operator || !file) return;
    if (type === "contract") {
      createContract.mutate({ company: operator.name, cnpj: "", validUntil, file });
    } else if (operator.contractId) {
      createAmendment.mutate({
        contract: { id: operator.contractId, company: operator.name },
        file,
      });
    }
    close();
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Adicionar documento"
      description="Cadastre um contrato ou aditivo vinculado a uma operadora."
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
            id="document-type"
            label="Tipo de documento"
            required
            placeholder="Selecione"
            options={DOCUMENT_TYPE_OPTIONS}
            value={type}
            onValueChange={(value) => {
              setType(value as DocumentType);
              setOperatorId("");
            }}
          />
          <SelectField
            // Remonta ao trocar o tipo para limpar a operadora exibida.
            key={type}
            id="document-operator"
            label="Operadora"
            required
            placeholder={type ? "Selecione" : "Selecione o tipo primeiro"}
            disabled={!type || available.length === 0}
            options={available.map((item) => ({ value: item.id, label: item.name }))}
            value={operatorId}
            onValueChange={setOperatorId}
          />
        </div>

        {type === "contract" && (
          <Field id="document-valid-until" label="Data de validade do contrato">
            <Input
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </Field>
        )}

        <Field
          id="document-file"
          label="Arquivo"
          required
          error={fileError}
          hint="PDF, DOC ou DOCX · Máx. 10 MB"
          injectChildProps={false}
        >
          <ContractFileDropzone inputId="document-file" file={file} onSelect={selectFile} />
        </Field>
      </form>
    </AppModal>
  );
}
