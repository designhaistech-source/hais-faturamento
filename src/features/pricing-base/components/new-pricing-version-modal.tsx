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
  const [files, setFiles] = useState<File[]>([]);
  const file = files[0] ?? null;
  // Brasíndice pode vir dividido em várias partes que compõem uma única versão.
  const multiple = baseType === "brasindice";
  const [fileTouched, setFileTouched] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [invalidFileMessage, setInvalidFileMessage] = useState<string | null>(null);

  const canSubmit = files.length > 0 && baseType !== "";
  const fileError =
    invalidFileMessage ??
    (fileTouched && files.length === 0
      ? multiple
        ? "Selecione ao menos um arquivo CSV ou TXT da base."
        : "Selecione o arquivo CSV ou TXT da base."
      : undefined);
  const baseTypeError =
    baseTypeTouched && baseType === "" ? "Selecione o tipo da base." : undefined;
  const replacesCurrent = baseType !== "" && existingBaseTypes.includes(baseType);

  function fileProblem(selected: File): string | null {
    if (!/\.(csv|txt)$/i.test(selected.name)) {
      return "Formato não aceito. Envie um arquivo CSV ou TXT.";
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) return "Arquivo maior que 10 MB.";
    return null;
  }

  function handleSelectedFile(selected: File | null) {
    setFileTouched(true);
    if (!selected) {
      setInvalidFileMessage(null);
      setFiles([]);
      return;
    }
    const problem = fileProblem(selected);
    setInvalidFileMessage(problem);
    setFiles(problem ? [] : [selected]);
  }

  function addFiles(selected: FileList | null) {
    setFileTouched(true);
    const incoming = Array.from(selected ?? []);
    if (incoming.length === 0) return;
    const problems = incoming.map(fileProblem);
    const accepted = incoming.filter((_, index) => problems[index] === null);
    setInvalidFileMessage(problems.find((problem) => problem !== null) ?? null);
    setFiles((previous) => {
      const known = new Set(previous.map(fileKey));
      return [...previous, ...accepted.filter((item) => !known.has(fileKey(item)))];
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(index: number) {
    setInvalidFileMessage(null);
    setFiles((previous) => previous.filter((_, position) => position !== index));
  }

  function reset() {
    setBaseType("");
    setBaseTypeTouched(false);
    setFiles([]);
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
    if (files.length === 0 || baseType === "") return;
    onCreate({ files, baseType });
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
            // Ao sair do Brasíndice, só um arquivo continua valendo.
            if (value !== "brasindice") setFiles((previous) => previous.slice(0, 1));
            setBaseType(value as PricingBaseType);
          }}
        />

        <Field
          id="pricing-version-file"
          label={multiple ? "Arquivo(s) CSV ou TXT" : "Arquivo CSV ou TXT"}
          required
          error={fileError}
          hint={
            multiple
              ? "Um ou mais arquivos CSV ou TXT • Máx. 10 MB por arquivo"
              : "CSV ou TXT • Máx. 10 MB"
          }
          injectChildProps={false}
        >
          {multiple ? (
            <MultiFileUpload
              inputRef={inputRef}
              files={files}
              dragActive={dragActive}
              setDragActive={setDragActive}
              onAdd={addFiles}
              onRemove={removeFile}
            />
          ) : (
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
          )}
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

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

interface MultiFileUploadProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  files: File[];
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}

/** Mesmo padrão de upload múltiplo do cadastro de TUSS. */
function MultiFileUpload({
  inputRef,
  files,
  dragActive,
  setDragActive,
  onAdd,
  onRemove,
}: MultiFileUploadProps) {
  return (
    <div className="min-w-0 space-y-2">
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center transition-colors",
          dragActive && "border-primary bg-primary-muted",
        )}
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
          onAdd(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          id="pricing-version-file"
          type="file"
          multiple
          accept=".csv,.txt,text/csv,text/plain"
          className="sr-only"
          onChange={(event) => onAdd(event.target.files)}
        />
        <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Arraste e solte os arquivos aqui</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          {files.length > 0 ? "Adicionar arquivos" : "Selecionar arquivos"}
        </Button>
      </div>

      {files.length > 0 && (
        <ul
          aria-label="Arquivos adicionados"
          className="max-h-48 divide-y divide-border overflow-y-auto rounded-xl border border-border"
        >
          {files.map((file, index) => (
            <li key={fileKey(file)} className="flex min-w-0 items-center gap-3 px-3 py-2">
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
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      aria-label={`Remover ${file.name}`}
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-80 break-all">{`Remover ${file.name}`}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
