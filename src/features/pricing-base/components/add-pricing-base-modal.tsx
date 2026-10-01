import { useState } from "react";
import { Database } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { SelectField, type SelectOption } from "@/components/form-field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  INCREMENTAL_UPDATE_BASE_TYPES,
  PRICING_BASE_TYPES,
  pricingBaseTypeLabel,
  type NewPricingVersionInput,
  type PricingBaseType,
  type PricingVersion,
} from "../data/pricing-versions";
import { NewPricingVersionModal } from "./new-pricing-version-modal";
import { PricingUpdateModal } from "./pricing-update-modal";

const BASE_TYPE_OPTIONS: SelectOption[] = PRICING_BASE_TYPES.map((type) => ({
  value: type,
  label: pricingBaseTypeLabel(type),
}));

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
  const [baseType, setBaseType] = useState<PricingBaseType | "">("");
  // Só bases com atualização incremental exibem "Tipo de cadastro"; as demais seguem como nova versão.
  const hasOperationChoice = baseType !== "" && INCREMENTAL_UPDATE_BASE_TYPES.includes(baseType);
  const effectiveOperation: Operation = hasOperationChoice ? operation : "new-version";
  const updateUnavailable = baseType !== "" && !currentVersions.has(baseType);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setOperation("new-version");
      setBaseType("");
    }
    onOpenChange(next);
  }

  const baseTypePicker = (
    <SelectField
      id="pricing-add-base-type"
      label="Tipo da base"
      required
      placeholder="Selecione o tipo da base"
      options={BASE_TYPE_OPTIONS}
      triggerClassName="text-base/normal sm:text-sm/normal [&>span]:line-clamp-none [&>span]:block [&>span]:truncate"
      value={baseType === "" ? undefined : baseType}
      onValueChange={(value) => {
        const next = value as PricingBaseType;
        setBaseType(next);
        if (!currentVersions.has(next)) setOperation("new-version");
      }}
    />
  );

  const operationPicker = (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 text-sm font-medium text-foreground">
        Tipo de cadastro{" "}
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
            <RadioGroupItem
              id={`pricing-operation-${item.value}`}
              value={item.value}
              disabled={item.value === "update" && updateUnavailable}
            />
            <Label htmlFor={`pricing-operation-${item.value}`} className="text-sm font-normal">
              {item.value === "update" && updateUnavailable
                ? `${item.label} (sem versão atual)`
                : item.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );

  const leading = (
    <>
      {baseTypePicker}
      {hasOperationChoice && operationPicker}
    </>
  );

  return (
    <AppModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Cadastrar base"
      description="Cadastre uma nova versão ou adicione uma atualização a uma base existente."
      icon={<Database className="size-5" aria-hidden="true" />}
      unstyledBody
    >
      {effectiveOperation === "new-version" ? (
        <NewPricingVersionModal
          embedded
          leading={leading}
          fixedBaseType={baseType}
          open={open}
          onOpenChange={handleOpenChange}
          existingBaseTypes={existingBaseTypes}
          onCreate={onCreate}
        />
      ) : (
        <PricingUpdateModal
          embedded
          leading={leading}
          fixedBaseType={baseType}
          open={open}
          onOpenChange={handleOpenChange}
          currentVersions={currentVersions}
          onSubmit={onUpdate}
        />
      )}
    </AppModal>
  );
}
