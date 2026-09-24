import { useRef, useState } from "react";
import { BookMarked, Paperclip, Trash2, Upload } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  TUSS_TABLE_NUMBERS,
  tussTableLabel,
  type NewTussVersionInput,
} from "../data/tuss-versions";

const TABLE_OPTIONS = TUSS_TABLE_NUMBERS.map((number) => ({
  value: number,
  label: tussTableLabel(number),
}));

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface NewTussVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (version: NewTussVersionInput) => void;
}

/** Cadastro de uma nova versão do conjunto TUSS (mês/ano + arquivo). */
export function NewTussVersionModal({ open, onOpenChange, onCreate }: NewTussVersionModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tableName, setTableName] = useState("");
  const [tableTouched, setTableTouched] = useState(false);
  const [versionMonth, setVersionMonth] = useState("");
  const [versionTouched, setVersionTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileTouched, setFileTouched] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [invalidFileMessage, setInvalidFileMessage] = useState<string | null>(null);

  const validMonth = /^\d{4}-\d{2}$/.test(versionMonth);
  const validTable = tableName.trim() !== "";
  const canSubmit = Boolean(file) && validMonth && validTable;
  const tableError = tableTouched && !validTable ? "Selecione a tabela TUSS." : undefined;
  const fileError =
    invalidFileMessage ?? (fileTouched && !file ? "Selecione o arquivo da versão." : undefined);
  const versionError =
    versionTouched && !validMonth ? "Informe o mês e o ano da versão." : undefined;

  function handleSelectedFile(selected: File | null) {
    setFileTouched(true);
    if (!selected) {
      setInvalidFileMessage(null);
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
    setTableName("");
    setTableTouched(false);
    setVersionMonth("");
    setVersionTouched(false);
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
    setVersionTouched(true);
    setTableTouched(true);
    if (!file || !validMonth || !validTable) return;
    onCreate({ file, versionMonth, tableName });
    reset();
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Nova tabela TUSS"
      description="Envie o arquivo de uma tabela TUSS e informe a versão do Padrão TISS a que pertence."
      icon={<BookMarked className="size-5" aria-hidden="true" />}
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
          id="tuss-table-name"
          label="Tabela TUSS"
          required
          placeholder="Selecione a tabela"
          options={TABLE_OPTIONS}
          triggerClassName="text-base/normal sm:text-sm/normal [&>span]:line-clamp-none [&>span]:block [&>span]:truncate"
          value={tableName === "" ? undefined : tableName}
          error={tableError}
          onValueChange={(value) => {
            setTableTouched(true);
            setTableName(value);
          }}
        />
        <Field
          id="tuss-version-month"
          label="Versão"
          required
          error={versionError}
          hint="Mês e ano"
        >
          <Input
            type="month"
            value={versionMonth}
            onChange={(event) => {
              setVersionTouched(true);
              setVersionMonth(event.target.value);
            }}
          />
        </Field>

        <Field
          id="tuss-version-file"
          label="Arquivo"
          required
          error={fileError}
          hint="Máx. 10 MB"
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
              id="tuss-version-file"
              type="file"
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
      </form>
    </AppModal>
  );
}
