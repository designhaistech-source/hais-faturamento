import { useRef, useState, type ReactNode } from "react";
import { FilePlus2, Paperclip, Trash2, Upload } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface NewAmendmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (file: File) => void;
  pending?: boolean;
  /** Campos exibidos antes do upload (ex.: seleção de tipo e operadora). */
  leading?: ReactNode;
  /** Quando falso, exibe apenas `leading` e mantém o envio bloqueado. */
  ready?: boolean;
  title?: ReactNode;
  description?: ReactNode;
}

/** Envio do arquivo do aditivo, com as mesmas restrições do cadastro de contrato. */
export function NewAmendmentModal({
  open,
  onOpenChange,
  onCreate,
  pending,
  leading,
  ready = true,
  title = "Adicionar aditivo",
  description = "Anexe o arquivo do aditivo. Ele será vinculado a este contrato.",
}: NewAmendmentModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [dragActive, setDragActive] = useState(false);

  function select(selected: File | null) {
    if (inputRef.current) inputRef.current.value = "";
    if (!selected) {
      setFile(null);
      setError(undefined);
      return;
    }
    if (!ACCEPTED_EXTENSIONS.some((ext) => selected.name.toLowerCase().endsWith(ext))) {
      setFile(null);
      setError("Formato não aceito. Envie um arquivo PDF, DOC ou DOCX.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setError("Arquivo maior que 10 MB.");
      return;
    }
    setError(undefined);
    setFile(selected);
  }

  function close() {
    select(null);
    onOpenChange(false);
  }

  function submit() {
    if (!ready || !file || pending) return;
    onCreate(file);
    close();
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={title}
      description={description}
      icon={<FilePlus2 className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={!ready || !file || pending} onClick={submit}>
            Adicionar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {leading}
        {ready && (
          <Field
            id="amendment-file"
            label="Aditivo"
            required
            error={error}
            hint="PDF, DOC ou DOCX • Máx. 10 MB"
            injectChildProps={false}
          >
            <div
              className="min-w-0"
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
                select(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <input
                ref={inputRef}
                id="amendment-file"
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(event) => select(event.target.files?.[0] ?? null)}
              />
              {file ? (
                <div
                  className={cn(
                    "flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-3",
                    dragActive && "border-primary bg-primary-muted",
                  )}
                >
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
                    "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center",
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
        )}
      </div>
    </AppModal>
  );
}
