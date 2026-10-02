import { SelectField } from "@/components/form-field";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ClipboardList, Download, Eye, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
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
import { SurfaceCard } from "@/components/surface-card";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatIsoToBr, toLocalIsoDate } from "@/lib/date";

import type { Contract } from "../data/contracts";
import { contractsQueryKey, createContractFileUrl, listContracts } from "../data/contracts-service";
import {
  amendmentAsContractFile,
  contractAmendmentsQueryKey,
  listContractAmendments,
} from "../data/contract-amendments-service";
import type { ContractRulesDisplayStatus } from "../data/contract-rules";
import {
  contractRulesStatusQueryKey,
  listContractRulesStatuses,
} from "../data/contract-rules-service";
import { useContractExtractionStates } from "../data/contract-extraction";
import { ContractPreviewModal } from "./contract-preview-modal";
import { ContractRulesStatusBadge } from "./contract-rules-status-badge";
import { AmendmentStatusBadge } from "./amendment-status-badge";
import { ActionIcon } from "@/components/action-icons";
import { NewAmendmentModal } from "./new-amendment-modal";
import { ContractRulesByFileTab } from "./contract-rules-by-file-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appTabsLabelClass, appTabsListClass, appTabsTriggerClass } from "@/components/app-tabs";
import { useCreateAmendment } from "../data/use-contract-registration";

const COLUMNS = [
  "Arquivo",
  "Tipo",
  "Cadastrado por",
  "Data do cadastro",
  "Status da extração",
  "Ações",
];

const EXTRACTION_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "available", label: "Concluída" },
  { value: "extracting", label: "Extraindo..." },
  { value: "not_extracted", label: "Não extraída" },
  { value: "not_identified", label: "Não identificados" },
  { value: "failed", label: "Falha na extração" },
];

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

/** Relação contratual vista a partir da operadora (substitui cabeçalho e resumo). */
export interface ContractOperatorContext {
  /** Segmento da URL da página da operadora. */
  id: string;
  name: string;
  /** yyyy-MM-dd */
  validUntil: string;
}

export function ContractDetailsPage({
  contractId,
  operator,
  variant = "default",
}: {
  contractId: string;
  operator?: ContractOperatorContext;
  /** Versão temporária para comparar a organização em abas. */
  variant?: "default" | "test";
}) {
  const isTest = variant === "test";
  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });
  const contract = contractsQuery.data?.find((item) => item.id === contractId) ?? null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey={isTest ? "contratos-teste" : "contratos"} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb currentLabel={operator?.name} />
            <PageHeader
              title={operator?.name ?? "Detalhes do contrato"}
              description={operator ? "Contrato com a operadora." : contract?.company}
              actions={
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to={isTest ? "/contratos-teste" : "/contratos"}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {operator && !isTest ? "Voltar para operadoras" : "Voltar para contratos"}
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
              <ContractDetailsContent contract={contract} operator={operator} isTest={isTest} />
            )}
          </main>
          <SiteFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}

function ContractDetailsContent({
  contract,
  operator,
  isTest,
}: {
  contract: Contract;
  operator?: ContractOperatorContext;
  isTest: boolean;
}) {
  const queryKey = contractAmendmentsQueryKey(contract.id);
  const amendmentsQuery = useQuery({
    queryKey,
    queryFn: () => listContractAmendments(contract.id),
  });
  const amendments = useMemo(() => amendmentsQuery.data ?? [], [amendmentsQuery.data]);
  const rulesStatusQuery = useQuery({
    queryKey: contractRulesStatusQueryKey,
    queryFn: listContractRulesStatuses,
  });
  const extractionStates = useContractExtractionStates();
  const rulesStatus: ContractRulesDisplayStatus | null =
    (extractionStates[contract.id] as ContractRulesDisplayStatus | undefined) ??
    (rulesStatusQuery.data ? (rulesStatusQuery.data[contract.id] ?? "not_extracted") : null);

  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<Contract | null>(null);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractRulesDisplayStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const files = useMemo<FileRow[]>(
    () => [
      {
        id: contract.id,
        name: contract.file.name,
        kind: "Contrato original",
        createdBy: "—",
        createdAt: contract.createdAt,
        status: <ContractRulesStatusBadge status={rulesStatus} />,
        statusKey: rulesStatus,
        file: contract.file,
        onView: () => setPreview(contract),
      },
      ...amendments.map<FileRow>((item) => ({
        id: item.id,
        name: item.file.name,
        kind: "Aditivo",
        createdBy: item.createdBy,
        createdAt: item.createdAt,
        status: <AmendmentStatusBadge status={item.extractionStatus} />,
        statusKey: item.extractionStatus,
        file: item.file,
        onView: () => setPreview(amendmentAsContractFile(item, contract.company)),
      })),
    ],
    [contract, amendments, rulesStatus],
  );

  const activeCount = [search.trim() !== "", statusFilter !== "all", from !== "", to !== ""].filter(
    Boolean,
  ).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return files.filter((item) => {
      if (term && !item.name.toLowerCase().includes(term)) return false;
      if (statusFilter !== "all" && item.statusKey !== statusFilter) return false;
      if ((from || to) && !item.createdAt) return false;
      if (!item.createdAt) return true;
      const day = toLocalIsoDate(new Date(item.createdAt));
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [files, search, statusFilter, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function clearFilters() {
    setSearch("");
    setFrom("");
    setTo("");
    setStatusFilter("all");
    setPage(1);
  }

  const createMutation = useCreateAmendment();

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

  const summaryCard = (
    <SurfaceCard padding="md">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {(operator
          ? [
              { label: "Validade", value: formatIsoToBr(operator.validUntil) || "—" },
              {
                label: "Aditivos",
                value: amendmentsQuery.isSuccess ? String(amendments.length) : "—",
              },
              {
                label: "Arquivos",
                value: amendmentsQuery.isSuccess ? String(files.length) : "—",
              },
            ]
          : [
              { label: "Prestador", value: contract.company },
              {
                label: "CNPJ",
                value: <span className="font-mono">{contract.cnpj || "—"}</span>,
              },
              { label: "Validade", value: formatIsoToBr(contract.validUntil) || "—" },
              {
                label: "Status da extração",
                value: <ContractRulesStatusBadge status={rulesStatus} />,
              },
            ]
        ).map((item) => (
          <div key={item.label} className="min-w-0 space-y-0.5">
            <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
            <dd className="min-w-0 break-words text-sm text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </SurfaceCard>
  );

  const filesBody = (
    <>
      {amendmentsQuery.isPending ? (
        <SurfaceCard padding="none">
          <TableSkeleton rows={3} columns={6} />
        </SurfaceCard>
      ) : amendmentsQuery.isError ? (
        <SurfaceCard padding="md">
          <ErrorState
            title="Não foi possível carregar os aditivos"
            description="Tente novamente em alguns instantes."
            onRetry={() => void amendmentsQuery.refetch()}
          />
        </SurfaceCard>
      ) : (
        <>
          <FilterCard
            id="amendments-filters"
            variant="bar"
            activeCount={activeCount}
            onClear={clearFilters}
            clearDisabled={activeCount === 0}
            barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_12rem_22rem_auto] lg:gap-4"
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
            <SelectField
              id="amendments-extraction-status"
              label="Status da extração"
              className="sm:col-span-2 lg:col-span-1"
              value={statusFilter}
              options={EXTRACTION_STATUS_FILTER_OPTIONS}
              onValueChange={(value) => {
                setStatusFilter(value as ContractRulesDisplayStatus | "all");
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
              title="Nenhum arquivo encontrado"
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
                          <span className="block truncate" title={item.name}>
                            {item.name}
                          </span>
                        </DataTableCell>
                        <DataTableCell>{item.kind}</DataTableCell>
                        <DataTableCell>{item.createdBy}</DataTableCell>
                        <DataTableCell>
                          {item.createdAt ? formatDateTime(item.createdAt) : "—"}
                        </DataTableCell>
                        <DataTableCell>{item.status}</DataTableCell>
                        <DataTableCell className="text-right">
                          <FileActions
                            row={item}
                            operatorId={operator?.id ?? contract.id}
                            showExtraction={!isTest}
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
                      title={<span className="min-w-0 truncate">{item.name}</span>}
                    />
                    <DataTableCardFields
                      className="gap-x-4 gap-y-1"
                      fields={[
                        { label: "Tipo", value: item.kind },
                        { label: "Cadastrado por", value: item.createdBy },
                        {
                          label: "Data do cadastro",
                          value: item.createdAt ? formatDateTime(item.createdAt) : "—",
                        },
                        { label: "Status da extração", value: item.status },
                      ]}
                    />
                    <DataTableCardActions className="-mt-0.5 justify-end">
                      <FileActions
                        row={item}
                        operatorId={operator?.id ?? contract.id}
                        showExtraction={!isTest}
                      />
                    </DataTableCardActions>
                  </DataTableCard>
                ))}
              </DataTableCardList>

              <TablePagination
                id="contract-files"
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
    </>
  );

  const ruleSources = files.map((item) => ({
    id: item.id,
    name: item.name,
    amendmentId: item.kind === "Aditivo" ? item.id : null,
    onView: item.onView,
  }));

  return (
    <div className="space-y-6">
      {summaryCard}

      {isTest ? (
        <section aria-labelledby="contract-content-title" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2
              id="contract-content-title"
              className="font-display text-base font-semibold tracking-tight text-foreground"
            >
              Conteúdo do contrato
            </h2>
            {addButton}
          </div>
          <Tabs defaultValue="files" className="space-y-4">
            <TabsList className={appTabsListClass}>
              <TabsTrigger value="files" className={appTabsTriggerClass}>
                <span className={appTabsLabelClass}>
                  Arquivos{amendmentsQuery.isSuccess && ` (${files.length})`}
                </span>
              </TabsTrigger>
              <TabsTrigger value="rules" className={appTabsTriggerClass}>
                <span className={appTabsLabelClass}>Regras identificadas</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="files"
              forceMount
              className="space-y-4 data-[state=inactive]:hidden"
            >
              {filesBody}
            </TabsContent>
            <TabsContent value="rules" className="space-y-4">
              {amendmentsQuery.isSuccess ? (
                <ContractRulesByFileTab contractId={contract.id} files={ruleSources} />
              ) : (
                <SurfaceCard padding="none">
                  <TableSkeleton rows={3} columns={5} />
                </SurfaceCard>
              )}
            </TabsContent>
          </Tabs>
        </section>
      ) : (
        <section aria-labelledby="contract-files-title" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="contract-files-title" className="text-lg font-semibold text-foreground">
              Arquivos do contrato
            </h2>
            {addButton}
          </div>
          {filesBody}
        </section>
      )}

      <NewAmendmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        pending={createMutation.isPending}
        onCreate={(file) => createMutation.mutate({ contract, file })}
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

interface FileRow {
  id: string;
  name: string;
  kind: "Contrato original" | "Aditivo";
  createdBy: string;
  createdAt?: string;
  status: ReactNode;
  statusKey: ContractRulesDisplayStatus | null;
  file: { path: string; name: string };
  onView: () => void;
}

function FileActions({
  row,
  operatorId,
  showExtraction,
}: {
  row: FileRow;
  operatorId: string;
  showExtraction: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Visualizar arquivo ${row.name}`}
            onClick={row.onView}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar arquivo</TooltipContent>
      </Tooltip>
      {showExtraction && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label={`Ver detalhes da extração de ${row.name}`}
            >
              <Link
                to="/contratos/$contractId/extracao/$fileId"
                params={{ contractId: operatorId, fileId: row.id }}
              >
                <ClipboardList className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver detalhes da extração</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Baixar arquivo ${row.name}`}
            onClick={() => void downloadFile(row.file)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Baixar arquivo</TooltipContent>
      </Tooltip>
    </div>
  );
}
