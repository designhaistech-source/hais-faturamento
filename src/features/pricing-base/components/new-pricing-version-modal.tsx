import { useRef, useState } from "react";
import { Database, Info, Paperclip, Trash2, Upload } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField, type SelectOption } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  PRICING_BASE_TYPES,
  pricingBaseTypeLabel,
  type NewPricingVersionInput,
  type PricingBaseType,
} from "../data/pricing-versions";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const BASE_TYPE_OPTIONS: SelectOption[] = PRICING_BASE_TYPES.map((type) => ({
  value: type,
  label: pricingBaseTypeLabel(type),
}));

interface NewPricingVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (version: NewPricingVersionInput) => void;
  /** Tipos de base que já possuem ao menos uma versão cadastrada. */
  existingBaseTypes?: readonly PricingBaseType[];
}

/** Cadastro de uma nova versão da base de precificação (tipo da base + arquivo CSV ou TXT). */
export function NewPricingVersionModal({
  open,
  onOpenChange,
  onCreate,
  existingBaseTypes = [],
}: NewPricingVersionModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [baseType, setBaseType] = useState<PricingBaseType | "">("");
  const [baseTypeTouched, setBaseTypeTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileTouched, setFileTouched] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [invalidFileMessage, setInvalidFileMessage] = useState<string | null>(null);

  const canSubmit = Boolean(file) && baseType !== "";
  const fileError =
    invalidFileMessage ??
    (fileTouched && !file ? "Selecione o arquivo CSV ou TXT da base." : undefined);
  const baseTypeError =
    baseTypeTouched && baseType === "" ? "Selecione o tipo da base." : undefined;
  const replacesCurrent = baseType !== "" && existingBaseTypes.includes(baseType);

  function handleSelectedFile(selected: File | null) {
    setFileTouched(true);
    if (!selected) {
      setInvalidFileMessage(null);
      setFile(null);
      return;
    }
    if (!/\.(csv|txt)$/i.test(selected.name)) {
      setInvalidFileMessage("Formato não aceito. Envie um arquivo CSV ou TXT.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setInvalidFileMessage("Arquivo maior que 10 MB.");
      setFile(null);
      return;
    }
    setInvalidFileMessage(null);
    setFile(selected);
  }

  function reset() {
    setBaseType("");
    setBaseTypeTouched(false);
    setFile(null);
    setFileTouched(false);
    setInvalidFileMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function submit() {
    setFileTouched(true);
    setBaseTypeTouched(true);
    if (!file || baseType === "") return;
    onCreate({ file, baseType });
    reset();
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Cadastrar nova versão"
      description="Envie o arquivo CSV ou TXT com os valores atualizados da base de precificação."
      icon={<Database className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={!canSubmit} onClick={submit}>
            Cadastrar
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
          id="pricing-version-base-type"
          label="Tipo da base"
          required
          placeholder="Selecione o tipo da base"
          options={BASE_TYPE_OPTIONS}
          // line-height 1 do trigger cortava o texto no mobile: usa leading normal.
          triggerClassName="text-base/normal sm:text-sm/normal [&>span]:line-clamp-none [&>span]:block [&>span]:truncate"
          value={baseType === "" ? undefined : baseType}
          error={baseTypeError}
          onValueChange={(value) => {
            setBaseTypeTouched(true);
            setBaseType(value as PricingBaseType);
          }}
        />

        <Field
          id="pricing-version-file"
          label="Arquivo CSV ou TXT"
          required
          error={fileError}
          hint="CSV ou TXT • Máx. 10 MB"
          injectChildProps={false}
        >
          <div
            className="min-w-0"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              const dropped = event.dataTransfer.files?.[0];
              if (!dropped) return;
              handleSelectedFile(dropped);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            <input
              ref={inputRef}
              id="pricing-version-file"
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="sr-only"
              onChange={(event) => handleSelectedFile(event.target.files?.[0] ?? null)}
            />

            {file ? (
              <div
                className={cn(
                  "flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-3 transition-colors",
                  dragActive && "border-primary bg-primary-muted",
                )}
              >
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="min-w-0 flex-1 truncate rounded-sm text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {file.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-80 break-all">{file.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    Substituir
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      handleSelectedFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center transition-colors",
                  dragActive && "border-primary bg-primary-muted",
                )}
              >
                <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Arraste e solte o arquivo aqui</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  Selecionar arquivo
                </Button>
              </div>
            )}
          </div>
        </Field>

        {replacesCurrent && (
          <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info-muted px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-info-strong" aria-hidden="true" />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {`Esta será a nova versão atual de ${pricingBaseTypeLabel(baseType as PricingBaseType)}.`}
              </p>
              <p className="text-xs text-muted-foreground">
                A versão anterior continuará disponível no histórico.
              </p>
            </div>
          </div>
        )}
      </form>
    </AppModal>
  );
}
