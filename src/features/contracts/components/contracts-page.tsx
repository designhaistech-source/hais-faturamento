import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { ErrorState, TableSkeleton } from "@/components/data-state";
import { SurfaceCard } from "@/components/surface-card";
import { FilterCard } from "@/components/filter-card";
import { Field, SearchField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";

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
  deleteAllContracts,
  listContracts,
  prefetchContractFile,
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
  const [clearOpen, setClearOpen] = useState(false);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);

  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: contractsQueryKey,
    queryFn: listContracts,
  });
  const contracts = contractsQuery.data ?? [];

  const [search, setSearch] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const hasFilters = search.trim() !== "" || validFrom !== "" || validTo !== "";
  const activeCount = [search.trim() !== "", validFrom !== "", validTo !== ""].filter(
    Boolean,
  ).length;

  const filteredContracts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const termDigits = term.replace(/\D/g, "");

    return contracts.filter((contract) => {
      if (term) {
        const matchesCompany = contract.company.toLowerCase().includes(term);
        const cnpjDigits = contract.cnpj.replace(/\D/g, "");
        const matchesCnpj = termDigits.length > 0 && cnpjDigits.includes(termDigits);
        if (!matchesCompany && !matchesCnpj) return false;
      }
      if (validFrom && (!contract.validUntil || contract.validUntil < validFrom)) return false;
      if (validTo && (!contract.validUntil || contract.validUntil > validTo)) return false;
      return true;
    });
  }, [contracts, search, validFrom, validTo]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedContracts = useMemo(
    () => filteredContracts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredContracts, currentPage, pageSize],
  );

  function handleClearFilters() {
    setSearch("");
    setValidFrom("");
    setValidTo("");
    setPage(1);
  }

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

  const clearMutation = useMutation({
    mutationFn: deleteAllContracts,
    onSuccess: async () => {
      setClearOpen(false);
      await queryClient.invalidateQueries({ queryKey: contractsQueryKey });
      handleClearFilters();
      toast.success("Contratos cadastrados removidos.");
    },
    onError: () => {
      toast.error("Não foi possível limpar os contratos cadastrados.");
    },
  });

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
              <>
                <FilterCard
                  id="contracts-filters"
                  variant="bar"
                  activeCount={activeCount}
                  onClear={handleClearFilters}
                  clearDisabled={!hasFilters}
                  barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_21rem_auto] lg:gap-4"
                >
                  <SearchField
                    id="contracts-search"
                    label="Buscar"
                    fieldClassName="sm:col-span-2 lg:col-span-1"
                    placeholder="Buscar por empresa ou CNPJ"
                    value={search}
                    clearable
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    onClear={() => {
                      setSearch("");
                      setPage(1);
                    }}
                  />
                  <fieldset className="min-w-0 space-y-1.5 sm:col-span-2 sm:space-y-2 lg:col-span-1">
                    <legend className="text-xs font-medium leading-snug text-muted-foreground">
                      Validade
                    </legend>
                    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-nowrap">
                      <span className="shrink-0 text-xs text-muted-foreground">De</span>
                      <Input
                        id="contracts-valid-from"
                        type="date"
                        aria-label="Validade de"
                        className="min-w-0 flex-1"
                        value={validFrom}
                        max={validTo || undefined}
                        onChange={(event) => {
                          setValidFrom(event.target.value);
                          setPage(1);
                        }}
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">até</span>
                      <Input
                        id="contracts-valid-to"
                        type="date"
                        aria-label="Validade até"
                        className="min-w-0 flex-1"
                        value={validTo}
                        min={validFrom || undefined}
                        onChange={(event) => {
                          setValidTo(event.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </fieldset>
                </FilterCard>

                {filteredContracts.length === 0 ? (
                  <EmptyStateCard
                    icon={<FileText className="size-10" aria-hidden="true" />}
                    title="Nenhum contrato encontrado"
                    description="Ajuste a busca ou o período de validade para ver outros resultados."
                    action={
                      <Button type="button" variant="outline" onClick={handleClearFilters}>
                        Limpar filtros
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
                          {paginatedContracts.map((contract) => (
                            <DataTableRow key={contract.id}>
                              <DataTableCell className="font-medium">
                                {contract.company}
                              </DataTableCell>
                              <DataTableCell className="font-mono">
                                {contract.cnpj || "—"}
                              </DataTableCell>
                              <DataTableCell>
                                {formatIsoToBr(contract.validUntil) || "—"}
                              </DataTableCell>
                              <DataTableCell className="max-w-72">
                                <ContractFileName name={contract.file.name} />
                              </DataTableCell>
                              <DataTableCell className="text-right">
                                <ContractActions contract={contract} onView={setPreviewContract} />
                              </DataTableCell>
                            </DataTableRow>
                          ))}
                        </DataTableBody>
                      </DataTableRoot>
                    </DataTableDesktop>

                    <DataTableCardList divided>
                      {paginatedContracts.map((contract) => (
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
                            <ContractActions contract={contract} onView={setPreviewContract} />
                          </DataTableCardActions>
                        </DataTableCard>
                      ))}
                    </DataTableCardList>

                    <TablePagination
                      id="contracts"
                      totalItems={filteredContracts.length}
                      page={currentPage}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                      }}
                      className="px-4 pb-4"
                    />
                  </DataTable>
                )}
              </>
            )}

            {/* Ferramenta provisória de testes: não faz parte do produto. */}
            {contracts.length > 0 && (
              <div className="flex justify-end border-t border-dashed border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  disabled={clearMutation.isPending}
                  onClick={() => setClearOpen(true)}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Limpar contratos cadastrados · Temporário
                </Button>
              </div>
            )}
          </main>

          <SiteFooter />
        </div>
      </div>

      <NewContractModal open={modalOpen} onOpenChange={setModalOpen} onCreate={handleCreate} />

      <ContractPreviewModal
        contract={previewContract}
        open={previewContract !== null}
        onOpenChange={(next) => {
          if (!next) setPreviewContract(null);
        }}
        onDownload={(contract) => void downloadContractFile(contract)}
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Limpar contratos cadastrados?"
        description="Esta ação apagará todos os contratos cadastrados e seus arquivos. Deseja continuar?"
        confirmLabel="Limpar contratos"
        onConfirm={() => clearMutation.mutate()}
      />
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
function ContractActions({
  contract,
  onView,
}: {
  contract: Contract;
  onView: (contract: Contract) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Visualizar contrato de ${contract.company}`}
            onClick={() => onView(contract)}
            onMouseEnter={() => prefetchContractFile(contract.file.path)}
            onFocus={() => prefetchContractFile(contract.file.path)}
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
