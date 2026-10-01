import { useRef, useState } from "react";
import { Paperclip, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Restrições dos documentos contratuais: PDF, DOC ou DOCX com no máximo 10 MB. */
export function validateContractFile(file: File): string | null {
  if (!ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return "Formato não aceito. Envie um arquivo PDF, DOC ou DOCX.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) return "Arquivo maior que 10 MB.";
  return null;
}

interface ContractFileDropzoneProps {
  inputId: string;
  file: File | null;
  onSelect: (file: File | null) => void;
}

/** Área de arrastar/selecionar arquivo usada nos cadastros de contrato e aditivo. */
export function ContractFileDropzone({ inputId, file, onSelect }: ContractFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function select(selected: File | null) {
    onSelect(selected);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
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
        // Ignora a saída para elementos filhos da própria drop zone.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) select(dropped);
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
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
  );
}
