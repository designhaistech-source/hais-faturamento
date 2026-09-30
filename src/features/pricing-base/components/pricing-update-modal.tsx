import type React from "react";
import { useRef, useState } from "react";
import { FilePlus2, Info, Paperclip, Trash2, Upload } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, SelectField, type SelectOption } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  INCREMENTAL_UPDATE_BASE_TYPES,
  pricingBaseTypeLabel,
  type PricingBaseType,
  type PricingVersion,
} from "../data/pricing-versions";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface PricingUpdateModalProps {
  /** Renderiza só corpo + rodapé, para uso dentro de outro modal. */
  embedded?: boolean;
  /** Conteúdo exibido antes dos campos (ex.: escolha da operação). */
  leading?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Versão "Atual" de cada tipo; tipos sem versão atual não podem receber atualização. */
  currentVersions: ReadonlyMap<PricingBaseType, PricingVersion>;
  onSubmit: (version: PricingVersion, file: File) => void;
}

/** Adiciona um arquivo à composição da versão atual de uma base (sem criar nova versão). */
export function PricingUpdateModal({
  embedded = false,
  leading,
  open,
  onOpenChange,
  currentVersions,
  onSubmit,
}: PricingUpdateModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [baseType, setBaseType] = useState<PricingBaseType | "">("");
  const [baseTypeTouched, setBaseTypeTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileTouched, setFileTouched] = useState(false);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const available = INCREMENTAL_UPDATE_BASE_TYPES.filter((type) => currentVersions.has(type));
  const options: SelectOption[] = available.map((type) => ({
    value: type,
    label: pricingBaseTypeLabel(type),
  }));
  const target = baseType === "" ? undefined : currentVersions.get(baseType);
  const canSubmit = target !== undefined && file !== null;
  const baseTypeError =
    baseTypeTouched && baseType === "" ? "Selecione o tipo da base." : undefined;
  const fileError =
    fileProblem ?? (fileTouched && !file ? "Selecione o arquivo de atualização." : undefined);

  function select(selected: File | null) {
    setFileTouched(true);
    if (inputRef.current) inputRef.current.value = "";
    if (!selected) {
      setFile(null);
      setFileProblem(null);
      return;
    }
    const problem = !/\.(csv|txt)$/i.test(selected.name)
      ? "Formato não aceito. Envie um arquivo CSV ou TXT."
      : selected.size > MAX_FILE_SIZE_BYTES
        ? "Arquivo maior que 10 MB."
        : null;
    setFileProblem(problem);
    setFile(problem ? null : selected);
  }

  function close() {
    setBaseType("");
    setBaseTypeTouched(false);
    setFile(null);
    setFileTouched(false);
    setFileProblem(null);
    onOpenChange(false);
  }

  function submit() {
    setBaseTypeTouched(true);
    setFileTouched(true);
    if (!target || !file) return;
    onSubmit(target, file);
    close();
  }

  const dropHandlers = {
    onDragEnter: (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(true);
    },
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(true);
    },
    onDragLeave: (event: React.DragEvent) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setDragActive(false);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) select(dropped);
    },
  };

  const footer = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={close}>
        Cancelar
      </Button>
      <Button type="button" size="sm" disabled={!canSubmit} onClick={submit}>
        Adicionar
      </Button>
    </>
  );

  const body = (
    <div className="space-y-4">
      {leading}
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <SelectField
          id="pricing-update-base-type"
          label="Tipo da base"
          required
          placeholder={
            options.length > 0 ? "Selecione o tipo da base" : "Nenhuma base com versão atual"
          }
          options={options}
          disabled={options.length === 0}
          triggerClassName="text-base/normal sm:text-sm/normal [&>span]:line-clamp-none [&>span]:block [&>span]:truncate"
          value={baseType === "" ? undefined : baseType}
          error={baseTypeError}
          hint={
            options.length === 0
              ? "Cadastre uma versão concluída de uma base que aceite atualização."
              : undefined
          }
          onValueChange={(value) => {
            setBaseTypeTouched(true);
            setBaseType(value as PricingBaseType);
          }}
        />

        {target && (
          <>
            <Field
              id="pricing-update-file"
              label="Arquivo de atualização"
              required
              error={fileError}
              hint="CSV ou TXT • Máx. 10 MB"
              injectChildProps={false}
            >
              <div className="min-w-0" {...dropHandlers}>
                <input
                  ref={inputRef}
                  id="pricing-update-file"
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="sr-only"
                  onChange={(event) => select(event.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div
                    className={cn(
                      "flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-3 transition-colors",
                      dragActive && "border-primary bg-primary-muted",
                    )}
                  >
                    <Paperclip
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span
                      className="min-w-0 flex-1 truncate text-sm text-foreground"
                      title={file.name}
                    >
                      {file.name}
                    </span>
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
                        onClick={() => select(null)}
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

            <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info-muted px-4 py-3">
              <Info className="mt-0.5 size-4 shrink-0 text-info-strong" aria-hidden="true" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {`Atualização da ${pricingBaseTypeLabel(target.baseType)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {`O arquivo será adicionado aos arquivos que compõem a versão atual da ${pricingBaseTypeLabel(target.baseType)}. Não será criada uma nova versão.`}
                </p>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );

  if (embedded) {
    return (
      <>
        <DialogBody>{body}</DialogBody>
        <DialogFooter>{footer}</DialogFooter>
      </>
    );
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Adicionar atualização"
      description="Envie um arquivo de atualização para adicioná-lo à versão atual da base."
      icon={<FilePlus2 className="size-5" aria-hidden="true" />}
      footer={footer}
    >
      {body}
    </AppModal>
  );
}
