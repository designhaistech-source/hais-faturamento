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

const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024;

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
  const [files, setFiles] = useState<File[]>([]);
  const [fileTouched, setFileTouched] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [invalidFileMessage, setInvalidFileMessage] = useState<string | null>(null);

  const validTable = tableName.trim() !== "";
  const canSubmit = files.length > 0 && validTable;
  const tableError = tableTouched && !validTable ? "Selecione a tabela TUSS." : undefined;
  const fileError =
    invalidFileMessage ??
    (fileTouched && files.length === 0 ? "Selecione ao menos um arquivo da tabela." : undefined);

  function addFiles(selected: FileList | null) {
    setFileTouched(true);
    const incoming = Array.from(selected ?? []);
    if (incoming.length === 0) return;
    const accepted = incoming.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);
    setInvalidFileMessage(accepted.length < incoming.length ? "Arquivo maior que 150 MB." : null);
    setFiles((previous) => {
      const known = new Set(previous.map(fileKey));
      return [...previous, ...accepted.filter((file) => !known.has(fileKey(file)))];
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(index: number) {
    setInvalidFileMessage(null);
    setFiles((previous) => previous.filter((_, position) => position !== index));
  }

  function reset() {
    setTableName("");
    setTableTouched(false);
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
    setTableTouched(true);
    if (files.length === 0 || !validTable) return;
    onCreate({ files, tableName });
    reset();
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Nova tabela TUSS"
      description="Selecione a tabela TUSS e envie o(s) arquivo(s) correspondente(s)."
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
          id="tuss-version-file"
          label="Arquivo(s)"
          required
          error={fileError}
          hint="Um ou mais arquivos • Máx. 150 MB por arquivo"
          injectChildProps={false}
        >
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
                addFiles(event.dataTransfer.files);
              }}
            >
              <input
                ref={inputRef}
                id="tuss-version-file"
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => addFiles(event.target.files)}
              />
              <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Arraste e solte os arquivos aqui</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                {files.length > 0 ? "Adicionar arquivos" : "Selecionar arquivos"}
              </Button>
            </div>

            {files.length > 0 && (
              <ul
                aria-label="Arquivos adicionados"
                className="divide-y divide-border rounded-xl border border-border"
              >
                {files.map((file, index) => (
                  <li key={fileKey(file)} className="flex min-w-0 items-center gap-3 px-3 py-2">
                    <Paperclip
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      aria-label={`Remover ${file.name}`}
                      onClick={() => removeFile(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>
      </form>
    </AppModal>
  );
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
