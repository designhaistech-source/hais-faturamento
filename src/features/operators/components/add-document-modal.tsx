import { useState } from "react";

import { SelectField } from "@/components/form-field";
import {
  NewAmendmentModal,
  NewContractModal,
  useCreateAmendment,
  useCreateContract,
} from "@/features/contracts";
import type { Operator } from "../data/operators";

type DocumentType = "contract" | "amendment";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "contract", label: "Contrato" },
  { value: "amendment", label: "Aditivo" },
];

const TITLE = "Adicionar documento";
const DESCRIPTION = "Selecione o tipo de documento e a operadora.";

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
  const createContract = useCreateContract();
  const createAmendment = useCreateAmendment();

  const available = operators.filter((operator) =>
    type === "contract" ? !operator.contractId : type === "amendment" && !!operator.contractId,
  );
  const operator = available.find((item) => item.id === operatorId);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setType("");
      setOperatorId("");
    }
    onOpenChange(next);
  }

  const leading = (
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
  );

  if (type === "amendment") {
    return (
      <NewAmendmentModal
        open={open}
        onOpenChange={handleOpenChange}
        title={TITLE}
        description={DESCRIPTION}
        leading={leading}
        ready={!!operator?.contractId}
        pending={createAmendment.isPending}
        onCreate={(file) => {
          if (!operator?.contractId) return;
          createAmendment.mutate({
            contract: { id: operator.contractId, company: operator.name },
            file,
          });
        }}
      />
    );
  }

  return (
    <NewContractModal
      open={open}
      onOpenChange={handleOpenChange}
      title={TITLE}
      description={DESCRIPTION}
      submitLabel="Adicionar"
      leading={leading}
      ready={type === "contract" && !!operator}
      operatorName={operator?.name ?? ""}
      onCreate={(input) => createContract.mutate(input)}
    />
  );
}
