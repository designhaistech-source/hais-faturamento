import { useQuery } from "@tanstack/react-query";

import { ContractDetailsPage } from "@/features/contracts";
import { AppSidebar } from "@/components/app-sidebar";
import { SurfaceCard } from "@/components/surface-card";
import { ErrorState, LoadingState } from "@/components/data-state";
import { getOperator } from "../data/operators";

/** Página da relação contratual com uma operadora, apoiada no detalhe do contrato. */
export function OperatorDetailsPage({ operatorId }: { operatorId: string }) {
  const query = useQuery({
    queryKey: ["operators", operatorId],
    queryFn: () => getOperator(operatorId),
  });
  const operator = query.data;

  if (operator?.contractId) {
    return (
      <ContractDetailsPage
        contractId={operator.contractId}
        operator={{ name: operator.name, validUntil: operator.validUntil }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="contratos" />
      <main className="min-w-0 flex-1 p-6 pt-20 md:pt-6">
        <SurfaceCard padding="md">
          {query.isPending ? (
            <LoadingState title="Carregando operadora" />
          ) : (
            <ErrorState
              title="Operadora sem contrato disponível"
              description="Volte para Operadoras e contratos e escolha uma operadora com contrato cadastrado."
              onRetry={query.isError ? () => void query.refetch() : undefined}
            />
          )}
        </SurfaceCard>
      </main>
    </div>
  );
}
