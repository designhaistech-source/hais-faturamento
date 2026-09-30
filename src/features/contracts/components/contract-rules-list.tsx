import { useQuery } from "@tanstack/react-query";
import { FileSearch, Quote } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";

import {
  contractRuleTitle,
  formatContractRuleValidity,
  summarizeContractRule,
} from "../data/contract-rules";
import { contractRulesQueryKey, listContractRules } from "../data/contract-rules-service";

/** Lista completa, somente leitura, das condições que a IA identificou no contrato. */
export function ContractRulesList({ contractId }: { contractId: string }) {
  const query = useQuery({
    queryKey: contractRulesQueryKey(contractId),
    queryFn: () => listContractRules(contractId),
  });

  if (query.isPending) return <LoadingState title="Carregando dados extraídos" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar os dados extraídos"
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (query.data.length === 0) {
    return (
      <EmptyState
        icon={<FileSearch className="size-5" aria-hidden="true" />}
        title="Nenhum dado identificado"
        description="Nenhuma condição foi identificada neste contrato."
      />
    );
  }
  return (
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
  );
}
