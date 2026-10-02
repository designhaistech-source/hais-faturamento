import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus } from "lucide-react";

import {
  ContractDetailsPage,
  NewContractModal,
  contractsQueryKey,
  listContracts,
  useCreateContract,
} from "@/features/contracts";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { SurfaceCard } from "@/components/surface-card";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { getOperator, resolveOperatorContractId } from "../data/operators";

/** Página da relação contratual com uma operadora, apoiada no detalhe do contrato. */
export function OperatorDetailsPage({
  operatorId,
  variant = "default",
}: {
  operatorId: string;
  variant?: "default" | "test";
}) {
  const isTest = variant === "test";
  const operatorQuery = useQuery({
    queryKey: ["operators", operatorId],
    queryFn: () => getOperator(operatorId),
  });
  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });
  const operator = operatorQuery.data;
  const contracts = contractsQuery.data ?? [];
  const contractId = operator ? resolveOperatorContractId(operator, contracts) : null;

  if (operator && contractId) {
    const contract = contracts.find((item) => item.id === contractId);
    return (
      <ContractDetailsPage
        contractId={contractId}
        variant={variant}
        operator={{
          id: operator.id,
          name: operator.name,
          validUntil: operator.validUntil || contract?.validUntil || "",
        }}
      />
    );
  }

  const pending = operatorQuery.isPending || contractsQuery.isPending;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey={"contratos"} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <AppBreadcrumb currentLabel={operator?.name} />
          <PageHeader
            title={operator?.name ?? "Operadora"}
            description="Contrato com a operadora."
            actions={
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to={"/contratos"}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {isTest ? "Voltar para contratos" : "Voltar para operadoras"}
                </Link>
              </Button>
            }
          />
          {pending ? (
            <SurfaceCard padding="md">
              <LoadingState title="Carregando operadora" />
            </SurfaceCard>
          ) : operatorQuery.isError || contractsQuery.isError ? (
            <SurfaceCard padding="md">
              <ErrorState
                title="Não foi possível carregar a operadora"
                description="Tente novamente em alguns instantes."
                onRetry={() => {
                  void operatorQuery.refetch();
                  void contractsQuery.refetch();
                }}
              />
            </SurfaceCard>
          ) : !operator ? (
            <SurfaceCard padding="md">
              <ErrorState
                title="Operadora não encontrada"
                description="Volte para Operadoras e seus contratos e escolha outra operadora."
              />
            </SurfaceCard>
          ) : (
            <NoContractState operatorName={operator.name} />
          )}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function NoContractState({ operatorName }: { operatorName: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const createMutation = useCreateContract();

  const action = (
    <Button type="button" disabled={createMutation.isPending} onClick={() => setModalOpen(true)}>
      <Plus className="size-4" aria-hidden="true" />
      {createMutation.isPending ? "Cadastrando..." : "Cadastrar contrato"}
    </Button>
  );

  return (
    <>
      <EmptyStateCard
        icon={<FileText className="size-10" aria-hidden="true" />}
        title="Nenhum contrato cadastrado"
        description="Cadastre o contrato com esta operadora para começar a gerenciar suas condições contratuais."
        action={action}
      />
      <NewContractModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        operatorName={operatorName}
        onCreate={(input) => createMutation.mutate(input)}
      />
    </>
  );
}
