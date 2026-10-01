import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { ExtractionDetailsPage, contractsQueryKey, listContracts } from "@/features/contracts";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { ErrorState, LoadingState } from "@/components/data-state";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";

import { getOperator, resolveOperatorContractId } from "../data/operators";

/** Resolve a operadora e o contrato antes de abrir os detalhes da extração de um arquivo. */
export function OperatorExtractionPage({
  operatorId,
  fileId,
}: {
  operatorId: string;
  fileId: string;
}) {
  const operatorQuery = useQuery({
    queryKey: ["operators", operatorId],
    queryFn: () => getOperator(operatorId),
  });
  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });
  const operator = operatorQuery.data;
  const contractId = operator ? resolveOperatorContractId(operator, contractsQuery.data ?? []) : null;

  if (operator && contractId) {
    return (
      <ExtractionDetailsPage
        contractId={contractId}
        fileId={fileId}
        operator={{ id: operator.id, name: operator.name }}
      />
    );
  }

  const pending = operatorQuery.isPending || contractsQuery.isPending;
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="contratos" />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <AppBreadcrumb />
          <PageHeader
            title="Detalhes da extração"
            actions={
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/contratos">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Voltar para operadoras
                </Link>
              </Button>
            }
          />
          <SurfaceCard padding="md">
            {pending ? (
              <LoadingState title="Carregando extração" />
            ) : (
              <ErrorState
                title="Arquivo não encontrado"
                description="Volte para Contratos com operadoras e escolha outra operadora."
              />
            )}
          </SurfaceCard>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
