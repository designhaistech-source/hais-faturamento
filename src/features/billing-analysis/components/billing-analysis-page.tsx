import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Download,
  Eye,
  EyeOff,
  FileSearch,
  LoaderCircle,
  Plus,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FilterCard } from "@/components/filter-card";
import { SearchField, SelectField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { toLocalIsoDate } from "@/lib/date";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ErrorState, TableSkeleton } from "@/components/data-state";
import { SurfaceCard } from "@/components/surface-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

import {
  NewBillingAnalysisModal,
  type NewBillingAnalysisInput,
} from "./new-billing-analysis-modal";
import { useBackgroundAnalysis } from "./background-analysis";
import { ProcessingDetailsModal, ProcessingStatusBadge } from "./processing-status";
import { getAnalysisXml } from "../data/billing-analyses-service";
import { downloadXml } from "../data/xml-preview";
import {
  analysisResultBadgeVariant,
  analysisResultLabel,
  formatAnalysisDateTime,
  hasAnalysisResult,
  hasProcessingIssue,
  PROCESSING_STATUS_LABEL,
  type BillingAnalysis,
  type ProcessingStatus,
} from "../data/billing-analyses";
import {
  billingAnalysesQueryKey,
  deleteAllBillingAnalyses,
  listBillingAnalyses,
  runBillingAnalysis,
  simulateProcessingError,
} from "../data/billing-analyses-service";

type ResultFilter = "all" | "divergent" | "unanalyzed" | "clean";

const RESULT_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "divergent", label: "Com divergências" },
  { value: "unanalyzed", label: "Com itens não analisados" },
  { value: "clean", label: "Sem divergências" },
];

function matchesResultFilter(analysis: BillingAnalysis, filter: ResultFilter): boolean {
  if (filter === "all") return true;
  if (!hasAnalysisResult(analysis)) return false;
  if (filter === "divergent") return analysis.divergenceCount > 0;
  if (filter === "unanalyzed") return analysis.unanalyzedCount > 0;
  if (filter === "clean") {
    return analysis.divergenceCount === 0 && analysis.unanalyzedCount === 0;
  }
  return true;
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos os status" },
  // Transient states (queued/processing) show in the table but aren't filterable.
  ...(Object.keys(PROCESSING_STATUS_LABEL) as ProcessingStatus[])
    .filter((value) => value !== "PENDING" && value !== "PROCESSING")
    .map((value) => ({
      value,
      label: PROCESSING_STATUS_LABEL[value],
    })),
];

const COLUMNS = [
  "Arquivo",
  "Contrato",
  "Prestador",
  "Operadora",
  "Data da análise",
  "Status",
  "Resultado",
  "Ações",
] as const;

/**
 * Análise de faturamento: envio do XML TISS, processamento com as regras do
 * contrato e as bases de precificação cadastradas, e listagem das análises.
 */
export function BillingAnalysisPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsAnalysis, setDetailsAnalysis] = useState<BillingAnalysis | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const queryClient = useQueryClient();

  const analysesQuery = useQuery({
    queryKey: billingAnalysesQueryKey,
    queryFn: listBillingAnalyses,
  });
  const storedAnalyses = analysesQuery.data ?? [];
  // Ferramentas provisórias de testes: não fazem parte do produto.
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const analyses = simulateEmpty ? [] : storedAnalyses;
  const clearMutation = useMutation({
    mutationFn: deleteAllBillingAnalyses,
    onSuccess: async () => {
      setClearOpen(false);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey });
      toast.success("Análises realizadas removidas.");
    },
    onError: () => {
      toast.error("Não foi possível limpar as análises realizadas.");
    },
  });

  const simulateErrorMutation = useMutation({
    mutationFn: simulateProcessingError,
    onSuccess: async () => {
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível simular a falha.");
    },
  });

  const handleNewAnalysis = () => setModalOpen(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | "all">("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [analyzedFrom, setAnalyzedFrom] = useState("");
  const [analyzedTo, setAnalyzedTo] = useState("");
  const activeCount = [
    search.trim() !== "",
    statusFilter !== "all",
    resultFilter !== "all",
    analyzedFrom !== "",
    analyzedTo !== "",
  ].filter(Boolean).length;
  const hasFilters = activeCount > 0;

  const filteredAnalyses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const digits = term.replace(/\D/g, "");
    return analyses.filter((analysis) => {
      if (term) {
        const fields = [
          analysis.fileName,
          analysis.contractCompany,
          analysis.provider,
          analysis.healthPlan,
        ];
        const textMatch = fields.some((field) => field.toLocaleLowerCase("pt-BR").includes(term));
        // CNPJ e registro ANS também são encontrados sem pontuação.
        const digitMatch =
          digits.length >= 3 && fields.some((field) => field.replace(/\D/g, "").includes(digits));
        if (!textMatch && !digitMatch) return false;
      }
      if (statusFilter !== "all" && analysis.processingStatus !== statusFilter) return false;
      if (!matchesResultFilter(analysis, resultFilter)) return false;
      if (analyzedFrom || analyzedTo) {
        const analyzed = new Date(analysis.analyzedAt);
        if (Number.isNaN(analyzed.getTime())) return false;
        const day = toLocalIsoDate(analyzed);
        if (analyzedFrom && day < analyzedFrom) return false;
        if (analyzedTo && day > analyzedTo) return false;
      }
      return true;
    });
  }, [analyses, search, statusFilter, resultFilter, analyzedFrom, analyzedTo]);

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("all");
    setResultFilter("all");
    setAnalyzedFrom("");
    setAnalyzedTo("");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredAnalyses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAnalyses = useMemo(
    () => filteredAnalyses.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredAnalyses, currentPage, pageSize],
  );

  const backgroundAnalysis = useBackgroundAnalysis();

  // A análise roda em segundo plano; o modal fecha assim que ela é iniciada.
  async function handleSubmit(input: NewBillingAnalysisInput) {
    setPage(1);
    backgroundAnalysis.start(input);
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="analise-faturamento" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Análise de faturamento"
              description="Analise arquivos XML TISS e identifique divergências nos valores faturados."
              actions={
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={backgroundAnalysis.isProcessing}
                  onClick={handleNewAnalysis}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Nova análise
                </Button>
              }
            />

            <section className="space-y-4">
              {analysesQuery.isPending ? (
                <SurfaceCard padding="none">
                  <TableSkeleton rows={4} columns={8} />
                </SurfaceCard>
              ) : analysesQuery.isError ? (
                <SurfaceCard padding="md">
                  <ErrorState
                    title="Não foi possível carregar as análises"
                    description="Tente novamente em alguns instantes."
                    onRetry={() => void analysesQuery.refetch()}
                  />
                </SurfaceCard>
              ) : analyses.length === 0 ? (
                <EmptyStateCard
                  icon={<FileSearch className="size-10" aria-hidden="true" />}
                  title="Nenhuma análise realizada"
                  description="Envie um arquivo XML TISS para começar."
                  action={
                    <Button type="button" onClick={handleNewAnalysis}>
                      <Plus className="size-4" aria-hidden="true" />
                      Nova análise
                    </Button>
                  }
                />
              ) : (
                <>
                  <FilterCard
                    id="billing-analyses-filters"
                    variant="bar"
                    activeCount={activeCount}
                    onClear={handleClearFilters}
                    clearDisabled={!hasFilters}
                    barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_11rem_11rem] lg:gap-4 xl:min-[1440px]:grid-cols-[minmax(10rem,1fr)_12rem_11rem_22rem_auto]"
                  >
                    <SearchField
                      id="billing-analyses-search"
                      label="Buscar"
                      fieldClassName="sm:col-span-2 lg:col-span-1"
                      placeholder="Buscar por arquivo, contrato ou prestador"
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
                      id="billing-analyses-status"
                      label="Status"
                      className="sm:col-span-2 lg:col-span-1"
                      value={statusFilter}
                      options={STATUS_FILTER_OPTIONS}
                      onValueChange={(value) => {
                        setStatusFilter(value as ProcessingStatus | "all");
                        setPage(1);
                      }}
                    />
                    <SelectField
                      id="billing-analyses-result"
                      label="Resultado"
                      className="sm:col-span-2 lg:col-span-1"
                      value={resultFilter}
                      options={RESULT_FILTER_OPTIONS}
                      onValueChange={(value) => {
                        setResultFilter(value as ResultFilter);
                        setPage(1);
                      }}
                    />
                    <fieldset className="min-w-0 space-y-1.5 sm:col-span-2 sm:space-y-2 lg:col-span-1">
                      <legend className="text-xs font-medium leading-snug text-muted-foreground">
                        Data da análise
                      </legend>
                      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-nowrap">
                        <span className="shrink-0 text-xs text-muted-foreground">De</span>
                        <Input
                          id="billing-analyses-from"
                          type="date"
                          aria-label="Data da análise de"
                          className="min-w-0 flex-1"
                          value={analyzedFrom}
                          max={analyzedTo || undefined}
                          onChange={(event) => {
                            setAnalyzedFrom(event.target.value);
                            setPage(1);
                          }}
                        />
                        <span className="shrink-0 text-xs text-muted-foreground">até</span>
                        <Input
                          id="billing-analyses-to"
                          type="date"
                          aria-label="Data da análise até"
                          className="min-w-0 flex-1"
                          value={analyzedTo}
                          min={analyzedFrom || undefined}
                          onChange={(event) => {
                            setAnalyzedTo(event.target.value);
                            setPage(1);
                          }}
                        />
                      </div>
                    </fieldset>
                  </FilterCard>

                  {filteredAnalyses.length === 0 ? (
                    <EmptyStateCard
                      icon={<FileSearch className="size-10" aria-hidden="true" />}
                      title="Nenhuma análise encontrada"
                      description="Ajuste os filtros para ver outros resultados."
                      action={
                        <Button type="button" variant="outline" onClick={handleClearFilters}>
                          Limpar filtros
                        </Button>
                      }
                    />
                  ) : (
                    <div className="mt-5 space-y-3">
                      <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
                        Análises realizadas
                      </h2>
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
                              {paginatedAnalyses.map((analysis) => (
                                <DataTableRow key={analysis.id}>
                                  <DataTableCell className="max-w-72">
                                    <AnalysisFileName name={analysis.fileName} />
                                  </DataTableCell>
                                  <DataTableCell>{analysis.contractCompany || "—"}</DataTableCell>
                                  <DataTableCell>{analysis.provider}</DataTableCell>
                                  <DataTableCell>{analysis.healthPlan}</DataTableCell>
                                  <DataTableCell>
                                    {formatAnalysisDateTime(analysis.analyzedAt)}
                                  </DataTableCell>
                                  <DataTableCell>
                                    <ProcessingStatusBadge status={analysis.processingStatus} />
                                  </DataTableCell>
                                  <DataTableCell>
                                    <AnalysisResultBadge analysis={analysis} />
                                  </DataTableCell>
                                  <DataTableCell className="text-right">
                                    <AnalysisActions
                                      analysis={analysis}
                                      onShowDetails={setDetailsAnalysis}
                                    />
                                  </DataTableCell>
                                </DataTableRow>
                              ))}
                            </DataTableBody>
                          </DataTableRoot>
                        </DataTableDesktop>

                        <DataTableCardList divided>
                          {paginatedAnalyses.map((analysis) => (
                            <DataTableCard key={analysis.id} flat className="space-y-1.5 py-2.5">
                              <DataTableCardHeader
                                title={
                                  <span className="flex flex-wrap gap-1.5">
                                    <ProcessingStatusBadge status={analysis.processingStatus} />
                                    <AnalysisResultBadge analysis={analysis} />
                                  </span>
                                }
                                subtitle={analysis.fileName}
                              />
                              <DataTableCardFields
                                className="gap-x-4 gap-y-1"
                                fields={[
                                  { label: "Contrato", value: analysis.contractCompany || "—" },
                                  { label: "Prestador", value: analysis.provider },
                                  { label: "Operadora", value: analysis.healthPlan },
                                  {
                                    label: "Data da análise",
                                    value: formatAnalysisDateTime(analysis.analyzedAt),
                                  },
                                ]}
                              />
                              <DataTableCardActions className="-mt-0.5 justify-end">
                                <AnalysisActions
                                  analysis={analysis}
                                  onShowDetails={setDetailsAnalysis}
                                />
                              </DataTableCardActions>
                            </DataTableCard>
                          ))}
                        </DataTableCardList>

                        <TablePagination
                          id="billing-analyses"
                          totalItems={filteredAnalyses.length}
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
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Ferramentas provisórias de testes: não fazem parte do produto. */}
            {storedAnalyses.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 border-t border-dashed border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setSimulateEmpty((previous) => !previous)}
                >
                  {simulateEmpty ? (
                    <EyeOff className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-3.5" aria-hidden="true" />
                  )}
                  {simulateEmpty
                    ? "Sair do estado vazio · Temporário"
                    : "Visualizar estado vazio · Temporário"}
                </Button>
                {!simulateEmpty && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    disabled={simulateErrorMutation.isPending}
                    onClick={() => simulateErrorMutation.mutate()}
                  >
                    <CircleX className="size-3.5" aria-hidden="true" />
                    Simular falha no processamento · Temporário
                  </Button>
                )}
                {!simulateEmpty && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    disabled={clearMutation.isPending}
                    onClick={() => setClearOpen(true)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Limpar análises realizadas · Temporário
                  </Button>
                )}
              </div>
            )}
          </main>

          <SiteFooter />
        </div>
      </div>

      <NewBillingAnalysisModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
      />
      <ProcessingDetailsModal
        analysis={detailsAnalysis}
        onRetry={(analysis) => {
          setDetailsAnalysis(null);
          backgroundAnalysis.retry(analysis.id, analysis.fileName);
        }}
        onOpenChange={(open) => {
          if (!open) setDetailsAnalysis(null);
        }}
      />
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Limpar análises realizadas?"
        description="Esta ação apagará todas as análises realizadas, com seus itens, resultados e arquivos XML. Contratos, regras e bases de precificação não serão afetados. Deseja continuar?"
        confirmLabel="Limpar análises"
        onConfirm={() => clearMutation.mutate()}
      />
    </TooltipProvider>
  );
}

/** Nome do arquivo truncado, com o valor completo em tooltip (mouse e teclado). */
function AnalysisFileName({ name }: { name: string }) {
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

/** Resultado da análise, com o detalhe dos itens não analisados em tooltip. */
function AnalysisResultBadge({ analysis }: { analysis: BillingAnalysis }) {
  if (!hasAnalysisResult(analysis)) {
    return (
      <span className="text-muted-foreground" aria-label="Sem resultado">
        —
      </span>
    );
  }
  const tone: StatusTone =
    analysis.status === "processing"
      ? "info"
      : analysis.status === "failed" || analysis.divergenceCount > 0
        ? "danger"
        : analysis.unanalyzedCount > 0
          ? "warning"
          : "success";
  const icon: LucideIcon =
    analysis.status === "processing"
      ? LoaderCircle
      : analysis.status === "failed"
        ? CircleAlert
        : analysis.divergenceCount > 0
          ? CircleX
          : analysis.unanalyzedCount > 0
            ? TriangleAlert
            : CircleCheck;
  const badge = (
    <StatusBadge
      tone={tone}
      icon={icon}
      label={analysisResultLabel(analysis)}
      spinning={analysis.status === "processing"}
    />
  );

  const detail =
    analysis.status === "failed"
      ? (analysis.errorMessage ?? "A análise não pôde ser concluída.")
      : analysis.status === "completed"
        ? `${analysis.itemCount} ${analysis.itemCount === 1 ? "item lido" : "itens lidos"}`
        : "Processando o arquivo enviado.";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {badge}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80">{detail}</TooltipContent>
    </Tooltip>
  );
}

/** Ações da linha: ver o resultado (quando concluída) e baixar o XML original. */
function AnalysisActions({
  analysis,
  onShowDetails,
}: {
  analysis: BillingAnalysis;
  onShowDetails: (analysis: BillingAnalysis) => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const xml = await getAnalysisXml(analysis.id);
      if (!xml) {
        toast.error("O XML original desta análise não está disponível.");
        return;
      }
      downloadXml(analysis.fileName, xml);
    } catch {
      toast.error("Não foi possível baixar o XML.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      {hasProcessingIssue(analysis.processingStatus) &&
        analysis.processingStatus !== "PARTIALLY_EXTRACTED" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Ver detalhes do processamento ${analysis.fileName}`}
                onClick={() => onShowDetails(analysis)}
              >
                <ActionIcon.inspectProcessing className="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalhes do processamento</TooltipContent>
          </Tooltip>
        )}
      {hasAnalysisResult(analysis) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon">
              <Link
                to="/analise-faturamento/$analysisId/resultado"
                params={{ analysisId: analysis.id }}
                aria-label={`Ver resultado da análise ${analysis.fileName}`}
              >
                <FileSearch className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver resultado</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Baixar XML ${analysis.fileName}`}
            disabled={downloading}
            onClick={() => void handleDownload()}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Baixar XML</TooltipContent>
      </Tooltip>
    </div>
  );
}
