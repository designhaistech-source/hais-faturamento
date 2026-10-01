import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  ContractDetailsPage,
  NewContractModal,
  contractRulesStatusQueryKey,
  contractsQueryKey,
  createContract,
  extractContractRulesFor,
  listContracts,
  type NewContractInput,
} from "@/features/contracts";
import { AppSidebar } from "@/components/app-sidebar";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { SurfaceCard } from "@/components/surface-card";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ErrorState, LoadingState } from "@/components/data-state";
import { useBackgroundTask } from "@/components/background-task";
import { Button } from "@/components/ui/button";
import { getOperator, resolveOperatorContractId } from "../data/operators";

/** Página da relação contratual com uma operadora, apoiada no detalhe do contrato. */
export function OperatorDetailsPage({ operatorId }: { operatorId: string }) {
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
        operator={{
          name: operator.name,
          validUntil: operator.validUntil || contract?.validUntil || "",
        }}
      />
    );
  }

  const pending = operatorQuery.isPending || contractsQuery.isPending;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="contratos" />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <AppBreadcrumb currentLabel={operator?.name} />
          <PageHeader
            title={operator?.name ?? "Operadora"}
            description="Contrato com a operadora."
            actions={
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/contratos">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Voltar para operadoras
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
                description="Volte para Operadoras e contratos e escolha outra operadora."
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
  const queryClient = useQueryClient();
  const backgroundTask = useBackgroundTask();

  const createMutation = useMutation({
    mutationFn: (input: NewContractInput) => createContract(input),
    onSuccess: async (contract) => {
      await queryClient.invalidateQueries({ queryKey: contractsQueryKey });
      // Mesma leitura automática do cadastro de contratos, em segundo plano.
      backgroundTask.start({
        kind: "contract-rules",
        fileName: contract.file.name,
        processing: {
          title: "Extraindo dados do contrato",
          description: "Extraindo as informações do contrato...",
        },
        failure: {
          title: "Falha na extração",
          description: "Não foi possível extrair os dados do contrato.",
        },
        run: async () => {
          try {
            const drafts = await extractContractRulesFor(contract);
            return {
              title: drafts.length > 0 ? "Dados extraídos" : "Nenhum dado identificado",
              description:
                drafts.length > 0
                  ? "Os dados do contrato estão disponíveis para consulta."
                  : "Nenhuma informação relevante foi identificada no contrato.",
            };
          } finally {
            await queryClient.invalidateQueries({ queryKey: contractRulesStatusQueryKey });
          }
        },
      });
    },
    onError: () => toast.error("Não foi possível cadastrar o contrato."),
  });

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
