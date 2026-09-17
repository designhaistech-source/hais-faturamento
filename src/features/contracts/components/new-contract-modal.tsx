import { useRef, useState } from "react";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createContractId, maskCnpj, type Contract } from "../data/contracts";

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

  const canSubmit = Boolean(file) && company.trim().length > 0;
  const fileError = fileTouched && !file ? "Selecione o arquivo do contrato." : undefined;
  const companyError =
    companyTouched && company.trim().length === 0 ? "Informe o nome da empresa." : undefined;

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
          injectChildProps={false}
        >
          <div className="min-w-0">
            <input
              ref={inputRef}
              id="contract-file"
              type="file"
              className="sr-only"
              onChange={(event) => {
                setFileTouched(true);
                setFile(event.target.files?.[0] ?? null);
              }}
            />

            {file ? (
              <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={file.name}>
                  {file.name}
                </span>
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
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Selecione o arquivo do contrato para anexar.
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
