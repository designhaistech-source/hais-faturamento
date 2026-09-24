import { useQuery } from "@tanstack/react-query";
import { FileSearch, Quote } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";

import type { Contract } from "../data/contracts";
import {
  contractRuleTitle,
  formatContractRuleValidity,
  summarizeContractRule,
} from "../data/contract-rules";
import { contractRulesQueryKey, listContractRules } from "../data/contract-rules-service";

interface ContractExtractedDataModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Consulta somente leitura dos dados que a IA identificou no contrato. */
export function ContractExtractedDataModal({
  contract,
  open,
  onOpenChange,
}: ContractExtractedDataModalProps) {
  const contractId = contract?.id ?? "";
  const query = useQuery({
    queryKey: contractRulesQueryKey(contractId),
    queryFn: () => listContractRules(contractId),
    enabled: open && contractId !== "",
  });

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Dados extraídos"
      description={contract ? `Informações identificadas no contrato de ${contract.company}.` : ""}
      icon={<FileSearch className="size-5" aria-hidden="true" />}
      footer={
        <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      }
    >
      {query.isPending ? (
        <LoadingState title="Carregando dados extraídos" />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar os dados extraídos"
          onRetry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Nenhum dado identificado"
          description="Nenhuma informação relevante foi identificada neste contrato."
        />
      ) : (
        <ul className="space-y-3">
          {query.data.map((rule) => {
            const validity = formatContractRuleValidity(rule);
            return (
              <li key={rule.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{contractRuleTitle(rule)}</p>
                  <p className="text-sm text-muted-foreground">{summarizeContractRule(rule)}</p>
                  {validity && <p className="text-xs text-muted-foreground">{validity}</p>}
                </div>
                {rule.sourceExcerpt.trim() && (
                  <blockquote className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    <Quote className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="sr-only">Trecho do contrato: </span>
                      {rule.sourceExcerpt}
                    </span>
                  </blockquote>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppModal>
  );
}
