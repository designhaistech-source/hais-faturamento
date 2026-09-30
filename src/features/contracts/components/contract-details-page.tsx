import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Download,
  Eye,
  FileText,
  LoaderCircle,
  Plus,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { useBackgroundTask } from "@/components/background-task";
import { ErrorState, LoadingState, TableSkeleton } from "@/components/data-state";
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
import { EmptyStateCard } from "@/components/empty-state-card";
import { FilterCard } from "@/components/filter-card";
import { SearchField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatIsoToBr, toLocalIsoDate } from "@/lib/date";
import { CURRENT_USER } from "@/lib/current-user";

import type { Contract } from "../data/contracts";
import { contractsQueryKey, createContractFileUrl, listContracts } from "../data/contracts-service";
import {
  amendmentAsContractFile,
  contractAmendmentsQueryKey,
  createContractAmendment,
  extractAmendment,
  listContractAmendments,
  type AmendmentExtractionStatus,
  type ContractAmendment,
} from "../data/contract-amendments-service";
import type { ContractRulesDisplayStatus } from "../data/contract-rules";
import {
  contractRulesStatusQueryKey,
  listContractRulesStatuses,
} from "../data/contract-rules-service";
import { useContractExtractionStates } from "../data/contract-extraction";
import { ContractPreviewModal } from "./contract-preview-modal";
import { ContractRulesStatusBadge } from "./contracts-page";
import { NewAmendmentModal } from "./new-amendment-modal";

const COLUMNS = ["Aditivo", "Cadastrado por", "Data do cadastro", "Status da extração", "Ações"];

const STATUS_CONFIG = {
  available: { tone: "success", icon: CircleCheck, label: "Concluída" },
  extracting: { tone: "info", icon: LoaderCircle, label: "Extraindo..." },
  not_identified: { tone: "warning", icon: TriangleAlert, label: "Não identificados" },
  failed: { tone: "danger", icon: CircleAlert, label: "Falha na extração" },
} as const satisfies Record<
  AmendmentExtractionStatus,
  { tone: StatusTone; icon: LucideIcon; label: string }
>;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function downloadFile(file: { path: string; name: string }) {
  try {
    const url = await createContractFileUrl(file.path, file.name);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    toast.error("Não foi possível baixar o arquivo.");
  }
}

export function ContractDetailsPage({ contractId }: { contractId: string }) {
  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });
  const contract = contractsQuery.data?.find((item) => item.id === contractId) ?? null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="contratos" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Detalhes do contrato"
              description={contract?.company}
              actions={
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/contratos">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Voltar para contratos
                  </Link>
                </Button>
              }
            />
            {contractsQuery.isPending ? (
              <SurfaceCard padding="md">
                <LoadingState title="Carregando contrato" />
              </SurfaceCard>
            ) : contractsQuery.isError ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Não foi possível carregar o contrato"
                  description="Tente novamente em alguns instantes."
                  onRetry={() => void contractsQuery.refetch()}
                />
              </SurfaceCard>
            ) : !contract ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Contrato não encontrado"
                  description="Ele pode ter sido removido. Volte para a lista de contratos."
                />
              </SurfaceCard>
            ) : (
              <ContractDetailsContent contract={contract} />
            )}
          </main>
          <SiteFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}

function ContractDetailsContent({ contract }: { contract: Contract }) {
  const queryClient = useQueryClient();
  const backgroundTask = useBackgroundTask();
  const queryKey = contractAmendmentsQueryKey(contract.id);
  const amendmentsQuery = useQuery({
    queryKey,
    queryFn: () => listContractAmendments(contract.id),
  });
  const amendments = amendmentsQuery.data ?? [];
  const rulesStatusQuery = useQuery({
    queryKey: contractRulesStatusQueryKey,
    queryFn: listContractRulesStatuses,
  });
  const extractionStates = useContractExtractionStates();
  const rulesStatus: ContractRulesDisplayStatus | null =
    extractionStates[contract.id] ??
    (rulesStatusQuery.data ? (rulesStatusQuery.data[contract.id] ?? "not_extracted") : null);

  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<Contract | null>(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const activeCount = [search.trim() !== "", from !== "", to !== ""].filter(Boolean).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return amendments.filter((item) => {
      if (term && !item.file.name.toLowerCase().includes(term)) return false;
      const day = toLocalIsoDate(new Date(item.createdAt));
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [amendments, search, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function clearFilters() {
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  function startExtraction(amendment: ContractAmendment) {
    backgroundTask.start({
      kind: "contract-amendment",
      fileName: amendment.file.name,
      processing: {
        title: "Extraindo dados do aditivo",
        description: "Extraindo as informações do aditivo...",
      },
      failure: {
        title: "Falha na extração",
        description: "Não foi possível extrair os dados do aditivo.",
      },
      run: async () => {
        try {
          const status = await extractAmendment(amendment, contract.company);
          return status === "available"
            ? {
                title: "Dados extraídos",
                description: "O aditivo foi processado com sucesso.",
              }
            : {
                title: "Nenhum dado identificado",
                description: "Nenhuma informação relevante foi identificada no aditivo.",
                tone: "warning",
              };
        } finally {
          await queryClient.invalidateQueries({ queryKey });
        }
      },
    });
  }

  const createMutation = useMutation({
    mutationFn: (file: File) =>
      createContractAmendment({ contractId: contract.id, file, createdBy: CURRENT_USER.name }),
    onSuccess: async (amendment) => {
      await queryClient.invalidateQueries({ queryKey });
      startExtraction(amendment);
    },
    onError: () => toast.error("Não foi possível adicionar o aditivo."),
  });

  const addButton = (
    <Button
      type="button"
      className="w-full sm:w-auto"
      disabled={createMutation.isPending}
      onClick={() => setModalOpen(true)}
    >
      <Plus className="size-4" aria-hidden="true" />
      Adicionar aditivo
    </Button>
  );

  return (
    <div className="space-y-6">
      <SurfaceCard padding="md">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Prestador", value: contract.company },
            { label: "CNPJ", value: <span className="font-mono">{contract.cnpj || "—"}</span> },
            {
              label: "Contrato",
              value: (
                <button
                  type="button"
                  className="max-w-full truncate rounded-sm text-left text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  title={contract.file.name}
                  onClick={() => setPreview(contract)}
                >
                  {contract.file.name}
                </button>
              ),
            },
            { label: "Validade", value: formatIsoToBr(contract.validUntil) || "—" },
            {
              label: "Status da extração",
              value: <ContractRulesStatusBadge status={rulesStatus} />,
            },
          ].map((item) => (
            <div key={item.label} className="min-w-0 space-y-0.5">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="min-w-0 break-words text-sm text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>

      <section className="space-y-4" aria-labelledby="amendments-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="amendments-title"
            className="font-display text-base font-semibold tracking-tight text-foreground"
          >
            Aditivos contratuais
          </h2>
          {addButton}
        </div>

        {amendmentsQuery.isPending ? (
          <SurfaceCard padding="none">
            <TableSkeleton rows={3} columns={5} />
          </SurfaceCard>
        ) : amendmentsQuery.isError ? (
          <SurfaceCard padding="md">
            <ErrorState
              title="Não foi possível carregar os aditivos"
              description="Tente novamente em alguns instantes."
              onRetry={() => void amendmentsQuery.refetch()}
            />
          </SurfaceCard>
        ) : amendments.length === 0 ? (
          <EmptyStateCard
            icon={<FileText className="size-10" aria-hidden="true" />}
            title="Nenhum aditivo cadastrado"
            description="Adicione um aditivo para vinculá-lo a este contrato."
            action={addButton}
          />
        ) : (
          <>
            <FilterCard
              id="amendments-filters"
              variant="bar"
              activeCount={activeCount}
              onClear={clearFilters}
              clearDisabled={activeCount === 0}
              barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_22rem_auto] lg:gap-4"
            >
              <SearchField
                id="amendments-search"
                label="Buscar"
                fieldClassName="sm:col-span-2 lg:col-span-1"
                placeholder="Buscar por nome do arquivo"
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
                  Data do cadastro
                </legend>
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-nowrap">
                  <span className="shrink-0 text-xs text-muted-foreground">De</span>
                  <Input
                    type="date"
                    aria-label="Data do cadastro de"
                    className="min-w-0 flex-1"
                    value={from}
                    max={to || undefined}
                    onChange={(event) => {
                      setFrom(event.target.value);
                      setPage(1);
                    }}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">até</span>
                  <Input
                    type="date"
                    aria-label="Data do cadastro até"
                    className="min-w-0 flex-1"
                    value={to}
                    min={from || undefined}
                    onChange={(event) => {
                      setTo(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </fieldset>
            </FilterCard>

            {filtered.length === 0 ? (
              <EmptyStateCard
                icon={<FileText className="size-10" aria-hidden="true" />}
                title="Nenhum aditivo encontrado"
                description="Ajuste a busca ou o período de cadastro para ver outros resultados."
                action={
                  <Button type="button" variant="outline" onClick={clearFilters}>
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
                      {paginated.map((item) => (
                        <DataTableRow key={item.id}>
                          <DataTableCell className="max-w-72 font-medium">
                            <span className="block truncate" title={item.file.name}>
                              {item.file.name}
                            </span>
                          </DataTableCell>
                          <DataTableCell>{item.createdBy}</DataTableCell>
                          <DataTableCell>{formatDateTime(item.createdAt)}</DataTableCell>
                          <DataTableCell>
                            <AmendmentStatusBadge status={item.extractionStatus} />
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            <AmendmentActions
                              amendment={item}
                              onView={() =>
                                setPreview(amendmentAsContractFile(item, contract.company))
                              }
                            />
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTableRoot>
                </DataTableDesktop>

                <DataTableCardList divided>
                  {paginated.map((item) => (
                    <DataTableCard key={item.id} flat className="space-y-1.5 py-2.5">
                      <DataTableCardHeader
                        title={<span className="min-w-0 truncate">{item.file.name}</span>}
                      />
                      <DataTableCardFields
                        className="gap-x-4 gap-y-1"
                        fields={[
                          { label: "Cadastrado por", value: item.createdBy },
                          { label: "Data do cadastro", value: formatDateTime(item.createdAt) },
                          {
                            label: "Status da extração",
                            value: <AmendmentStatusBadge status={item.extractionStatus} />,
                          },
                        ]}
                      />
                      <DataTableCardActions className="-mt-0.5 justify-end">
                        <AmendmentActions
                          amendment={item}
                          onView={() => setPreview(amendmentAsContractFile(item, contract.company))}
                        />
                      </DataTableCardActions>
                    </DataTableCard>
                  ))}
                </DataTableCardList>

                <TablePagination
                  id="amendments"
                  totalItems={filtered.length}
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
      </section>

      <NewAmendmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        pending={createMutation.isPending}
        onCreate={(file) => createMutation.mutate(file)}
      />

      <ContractPreviewModal
        contract={preview}
        open={preview !== null}
        onOpenChange={(next) => {
          if (!next) setPreview(null);
        }}
        onDownload={(item) => void downloadFile(item.file)}
      />
    </div>
  );
}

function AmendmentStatusBadge({ status }: { status: AmendmentExtractionStatus }) {
  const { tone, icon, label } = STATUS_CONFIG[status];
  return <StatusBadge tone={tone} icon={icon} label={label} spinning={status === "extracting"} />;
}

function AmendmentActions({
  amendment,
  onView,
}: {
  amendment: ContractAmendment;
  onView: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Visualizar aditivo ${amendment.file.name}`}
            onClick={onView}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar aditivo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Baixar aditivo ${amendment.file.name}`}
            onClick={() => void downloadFile(amendment.file)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Baixar aditivo</TooltipContent>
      </Tooltip>
    </div>
  );
}
