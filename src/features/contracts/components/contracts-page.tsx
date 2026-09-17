import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ErrorState, TableSkeleton } from "@/components/data-state";
import { SurfaceCard } from "@/components/surface-card";

import {
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCardActions,
  DataTableCardFields,
  DataTableCardHeader,
  DataTableCardList,
  DataTableCell,
  DataTableDesktop,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import { formatIsoToBr } from "@/lib/date";
import { NewContractModal } from "./new-contract-modal";
import { ContractPreviewModal } from "./contract-preview-modal";
import type { Contract, NewContractInput } from "../data/contracts";
import {
  contractsQueryKey,
  createContract,
  createContractFileUrl,
  listContracts,
} from "../data/contracts-service";

const COLUMNS = ["Empresa", "CNPJ", "Validade", "Contrato", "Ações"] as const;





async function downloadContractFile(contract: Contract) {
  try {
    const url = await createContractFileUrl(contract.file.path, contract.file.name);
    const link = document.createElement("a");
    link.href = url;
    link.download = contract.file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    toast.error("Não foi possível baixar o arquivo do contrato.");
  }
}

export function ContractsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: contractsQueryKey,
    queryFn: listContracts,
  });
  const contracts = contractsQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: (input: NewContractInput) => createContract(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contractsQueryKey });
      toast.success("Contrato cadastrado com sucesso.");
    },
    onError: () => {
      toast.error("Não foi possível cadastrar o contrato.");
    },
  });

  function handleCreate(input: NewContractInput) {
    createMutation.mutate(input);
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="contratos" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Contratos"
              description="Contratos das clínicas e hospitais cadastrados no HaisFaturamento."
              actions={
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Novo contrato
                </Button>
              }
            />

            {contractsQuery.isPending ? (
              <SurfaceCard padding="none">
                <TableSkeleton rows={4} columns={5} />
              </SurfaceCard>
            ) : contractsQuery.isError ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Não foi possível carregar os contratos"
                  description="Tente novamente em alguns instantes."
                  onRetry={() => void contractsQuery.refetch()}
                />
              </SurfaceCard>
            ) : contracts.length === 0 ? (
              <EmptyStateCard
                icon={<FileText className="size-10" aria-hidden="true" />}
                title="Nenhum contrato cadastrado"
                description="Cadastre um contrato para começar."
                action={
                  <Button type="button" onClick={() => setModalOpen(true)}>
                    <Plus className="size-4" aria-hidden="true" />
                    Novo contrato
                  </Button>
                }
              />
            ) : (
              <DataTable>
                <DataTableDesktop>
                  <DataTableRoot>
                    <DataTableHeader>
                      <tr>
                        {COLUMNS.map((column) => (
                          <DataTableHead
                            key={column}
                            className={column === "Ações" ? "text-right" : undefined}
                          >
                            {column}
                          </DataTableHead>
                        ))}
                      </tr>
                    </DataTableHeader>
                    <DataTableBody>
                      {contracts.map((contract) => (
                        <DataTableRow key={contract.id}>
                          <DataTableCell className="font-medium">{contract.company}</DataTableCell>
                          <DataTableCell className="font-mono">
                            {contract.cnpj || "—"}
                          </DataTableCell>
                          <DataTableCell>{formatIsoToBr(contract.validUntil) || "—"}</DataTableCell>
                          <DataTableCell className="max-w-72">
                            <ContractFileName name={contract.file.name} />
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            <ContractActions contract={contract} />
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTableRoot>
                </DataTableDesktop>

                <DataTableCardList divided>
                  {contracts.map((contract) => (
                    <DataTableCard key={contract.id} flat>
                      <DataTableCardHeader title={contract.company} />
                      <DataTableCardFields
                        fields={[
                          { label: "CNPJ", value: contract.cnpj || "—" },
                          {
                            label: "Validade",
                            value: formatIsoToBr(contract.validUntil) || "—",
                          },
                          {
                            label: "Contrato",
                            value: <ContractFileName name={contract.file.name} />,
                          },
                        ]}
                      />
                      <DataTableCardActions className="justify-end">
                        <ContractActions contract={contract} />
                      </DataTableCardActions>
                    </DataTableCard>
                  ))}
                </DataTableCardList>
              </DataTable>
            )}
          </main>
          <SiteFooter />
        </div>
      </div>

      <NewContractModal open={modalOpen} onOpenChange={setModalOpen} onCreate={handleCreate} />
    </TooltipProvider>
  );
}

/** Nome do arquivo truncado, com o valor completo em tooltip (mouse e teclado). */
function ContractFileName({ name }: { name: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="block min-w-0 truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {name}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 break-all">{name}</TooltipContent>
    </Tooltip>
  );
}

/** Ações da linha: apenas visualizar e baixar, identificadas por tooltip. */
function ContractActions({ contract }: { contract: Contract }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Visualizar contrato de ${contract.company}`}
            onClick={() => void openContractFile(contract)}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Baixar contrato de ${contract.company}`}
            onClick={() => void downloadContractFile(contract)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Baixar</TooltipContent>
      </Tooltip>
    </div>
  );
}
