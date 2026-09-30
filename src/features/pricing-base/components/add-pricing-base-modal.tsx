import { useState } from "react";
import { Database } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  NewPricingVersionInput,
  PricingBaseType,
  PricingVersion,
} from "../data/pricing-versions";
import { NewPricingVersionModal } from "./new-pricing-version-modal";
import { PricingUpdateModal } from "./pricing-update-modal";

type Operation = "new-version" | "update";

const OPERATIONS: { value: Operation; label: string }[] = [
  { value: "new-version", label: "Nova versão" },
  { value: "update", label: "Atualização" },
];

interface AddPricingBaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingBaseTypes: readonly PricingBaseType[];
  currentVersions: ReadonlyMap<PricingBaseType, PricingVersion>;
  onCreate: (input: NewPricingVersionInput) => void;
  onUpdate: (version: PricingVersion, file: File) => void;
}

/** Modal único do botão "Adicionar": nova versão ou atualização da versão atual. */
export function AddPricingBaseModal({
  open,
  onOpenChange,
  existingBaseTypes,
  currentVersions,
  onCreate,
  onUpdate,
}: AddPricingBaseModalProps) {
  const [operation, setOperation] = useState<Operation>("new-version");

  function handleOpenChange(next: boolean) {
    if (!next) setOperation("new-version");
    onOpenChange(next);
  }

  const operationPicker = (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 text-sm font-medium text-foreground">
        O que deseja adicionar?{" "}
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
        <span className="sr-only"> (obrigatório)</span>
      </legend>
      <RadioGroup
        value={operation}
        onValueChange={(value) => setOperation(value as Operation)}
        className="flex flex-wrap gap-x-6 gap-y-2"
      >
        {OPERATIONS.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <RadioGroupItem id={`pricing-operation-${item.value}`} value={item.value} />
            <Label htmlFor={`pricing-operation-${item.value}`} className="text-sm font-normal">
              {item.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Adicionar base de precificação"
      description="Cadastre uma nova versão ou adicione uma atualização a uma base existente."
      icon={<Database className="size-5" aria-hidden="true" />}
      unstyledBody
    >
      {operation === "new-version" ? (
        <NewPricingVersionModal
          embedded
          leading={operationPicker}
          open={open}
          onOpenChange={handleOpenChange}
          existingBaseTypes={existingBaseTypes}
          onCreate={onCreate}
        />
      ) : (
        <PricingUpdateModal
          embedded
          leading={operationPicker}
          open={open}
          onOpenChange={handleOpenChange}
          currentVersions={currentVersions}
          onSubmit={onUpdate}
        />
      )}
    </AppModal>
  );
}
