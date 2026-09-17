import { useRef, useState } from "react";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createContractId, maskCnpj, type Contract } from "../data/contracts";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;


interface NewContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (contract: Contract) => void;
}

/** Formulário de cadastro de contrato: arquivo obrigatório + dados da empresa. */
export function NewContractModal({ open, onOpenChange, onCreate }: NewContractModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [company, setCompany] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [fileTouched, setFileTouched] = useState(false);
  const [companyTouched, setCompanyTouched] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [invalidFileMessage, setInvalidFileMessage] = useState<string | null>(null);

  const canSubmit = Boolean(file) && company.trim().length > 0;
  const fileError =
    invalidFileMessage ??
    (fileTouched && !file ? "Selecione o arquivo do contrato." : undefined);
  const companyError =
    companyTouched && company.trim().length === 0 ? "Informe o nome da empresa." : undefined;

  /** Aplica as restrições implementadas: PDF, DOC ou DOCX com no máximo 10 MB. */
  function handleSelectedFile(selected: File | null) {
    setFileTouched(true);
    if (!selected) {
      setInvalidFileMessage(null);
      setFile(null);
      return;
    }
    if (!ACCEPTED_EXTENSIONS.some((ext) => selected.name.toLowerCase().endsWith(ext))) {
      setInvalidFileMessage("Formato não aceito. Envie um arquivo PDF, DOC ou DOCX.");
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
    setFile(null);
    setCompany("");
    setCnpj("");
    setValidUntil("");
    setFileTouched(false);
    setCompanyTouched(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function submit() {
    setFileTouched(true);
    setCompanyTouched(true);
    if (!file || company.trim().length === 0) return;
    onCreate({
      id: createContractId(),
      company: company.trim(),
      cnpj: cnpj.trim(),
      validUntil,
      file: { name: file.name, url: URL.createObjectURL(file), type: file.type },
    });
    reset();
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Novo contrato"
      description="Anexe o arquivo do contrato e informe os dados da empresa."
      icon={<FileText className="size-5" aria-hidden="true" />}
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
        <Field
          id="contract-file"
          label="Contrato"
          required
          error={fileError}
          hint="PDF, DOC ou DOCX • Máx. 10 MB"
          injectChildProps={false}
        >
          <div
            className="min-w-0"
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
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
              id="contract-file"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(event) => {
                handleSelectedFile(event.target.files?.[0] ?? null);
              }}
            />

            {file ? (
              <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-3">
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
                    variant="outline"
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
                      setFileTouched(true);
                      setFile(null);
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
                  dragActive && "border-primary bg-accent",
                )}
              >
                <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Arraste o arquivo aqui ou selecione do computador.
                </p>
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

        <Field id="contract-company" label="Nome da empresa" required error={companyError}>
          <Input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            onBlur={() => setCompanyTouched(true)}
            placeholder="Clínica ou hospital"
            autoComplete="organization"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contract-cnpj" label="CNPJ">
            <Input
              value={cnpj}
              onChange={(event) => setCnpj(maskCnpj(event.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              className="font-mono"
            />
          </Field>

          <Field id="contract-valid-until" label="Data de validade do contrato">
            <Input
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </Field>
        </div>
      </form>
    </AppModal>
  );
}
