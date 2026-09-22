import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileSearch, Paperclip, Trash2, Upload } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField, type SelectOption } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ContractRulesModal,
  contractRulesQueryKey,
  contractsQueryKey,
  listContractRules,
  listContracts,
  type Contract,
  type ContractRule,
} from "@/features/contracts";


const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface NewBillingAnalysisInput {
  file: File;
  contractId: string;
  contractCompany: string;
}

interface NewBillingAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Envio do XML + contrato: o processamento da análise será implementado depois. */
  onSubmit?: (input: NewBillingAnalysisInput) => void;
}

/** Envio do arquivo XML TISS e do contrato usado na análise de faturamento. */
export function NewBillingAnalysisModal({
  open,
  onOpenChange,
  onSubmit,
}: NewBillingAnalysisModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileTouched, setFileTouched] = useState(false);
  const [contractId, setContractId] = useState("");
  const [contractTouched, setContractTouched] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [invalidFileMessage, setInvalidFileMessage] = useState<string | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const contractsQuery = useQuery<Contract[]>({
    queryKey: contractsQueryKey,
    queryFn: listContracts,
    enabled: open,
  });
  const contracts = contractsQuery.data ?? [];
  const contractOptions = useMemo<SelectOption[]>(
    () => contracts.map((contract) => ({ value: contract.id, label: contract.company })),
    [contracts],
  );
  const selectedContract = contracts.find((item) => item.id === contractId) ?? null;

  const rulesQuery = useQuery<ContractRule[]>({
    queryKey: contractRulesQueryKey(contractId),
    queryFn: () => listContractRules(contractId),
    enabled: open && contractId !== "",
  });
  const rules = rulesQuery.data;
  const rulesReady =
    rules !== undefined && rules.length > 0 && rules.every((rule) => rule.reviewed);
  const showRulesWarning = contractId !== "" && rules !== undefined && !rulesReady;

  const canSubmit = Boolean(file) && contractId !== "" && rulesReady;
  const fileError =
    invalidFileMessage ?? (fileTouched && !file ? "Selecione o arquivo XML TISS." : undefined);
  const contractError =
    contractTouched && contractId === "" ? "Selecione o contrato da análise." : undefined;
  const contractHint = contractsQuery.isPending
    ? "Carregando contratos…"
    : contractsQuery.isError
      ? "Não foi possível carregar os contratos."
      : contracts.length === 0
        ? "Nenhum contrato cadastrado."
        : contractId !== "" && rulesQuery.isPending
          ? "Verificando as regras de remuneração…"
          : undefined;


  function handleSelectedFile(selected: File | null) {
    setFileTouched(true);
    if (!selected) {
      setInvalidFileMessage(null);
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".xml")) {
      setInvalidFileMessage("Formato não aceito. Envie um arquivo XML.");
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
    setFileTouched(false);
    setContractId("");
    setContractTouched(false);
    setInvalidFileMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function submit() {
    setFileTouched(true);
    setContractTouched(true);
    const contract = contracts.find((item) => item.id === contractId);
    if (!file || !contract || !rulesReady) return;
    onSubmit?.({ file, contractId: contract.id, contractCompany: contract.company });
    reset();
    onOpenChange(false);
  }

  return (
    <>
      <AppModal

      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="Nova análise de faturamento"
      description="Selecione o contrato e envie o arquivo XML TISS que deseja analisar."
      icon={<FileSearch className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={!canSubmit} onClick={submit}>
            Analisar
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
          id="billing-analysis-contract"
          label="Contrato"
          required
          placeholder="Selecione um contrato"
          options={contractOptions}
          disabled={contracts.length === 0}
          // line-height 1 do trigger cortava o texto no mobile: usa leading normal.
          triggerClassName="text-base/normal sm:text-sm/normal [&>span]:line-clamp-none [&>span]:block [&>span]:truncate"
          value={contractId === "" ? undefined : contractId}
          error={contractError}
          hint={contractHint}
          onValueChange={(value) => {
            setContractTouched(true);
            setContractId(value);
          }}
        />

        {showRulesWarning ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-muted px-4 py-3"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning-strong"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  Este contrato ainda não possui regras de remuneração revisadas.
                </p>
                <p className="text-sm text-muted-foreground">
                  Revise as regras do contrato antes de utilizá-lo em uma análise.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selectedContract}
                onClick={() => setRulesModalOpen(true)}
              >
                Revisar regras
              </Button>
            </div>
          </div>
        ) : null}



        <Field
          id="billing-analysis-file"
          label="Arquivo XML"
          required
          error={fileError}
          hint="XML • Máx. 10 MB"
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
              id="billing-analysis-file"
              type="file"
              accept=".xml,text/xml,application/xml"
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

      {selectedContract ? (
        <ContractRulesModal
          contract={selectedContract}
          open={rulesModalOpen}
          onOpenChange={setRulesModalOpen}
        />
      ) : null}
    </>
  );
}

