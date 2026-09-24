import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Eye, FileSearch, Plus } from "lucide-react";
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
import { AnalysisResultModal } from "./analysis-result-modal";
import {
  analysisResultBadgeVariant,
  analysisResultLabel,
  formatAnalysisDateTime,
  type BillingAnalysis,
} from "../data/billing-analyses";
import {
  billingAnalysesQueryKey,
  listBillingAnalyses,
  runBillingAnalysis,
} from "../data/billing-analyses-service";

const COLUMNS = [
  "Arquivo",
  "Contrato",
  "Prestador",
  "Operadora",
  "Data da análise",
  "Resultado",
  "Ações",
] as const;

/**
 * Análise de faturamento: envio do XML TISS, processamento com as regras do
 * contrato e as bases de precificação cadastradas, e listagem das análises.
 */
export function BillingAnalysisPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [resultAnalysis, setResultAnalysis] = useState<BillingAnalysis | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const queryClient = useQueryClient();

  const analysesQuery = useQuery({
    queryKey: billingAnalysesQueryKey,
    queryFn: listBillingAnalyses,
  });
  const analyses = analysesQuery.data ?? [];

  const handleNewAnalysis = () => setModalOpen(true);

  const totalPages = Math.max(1, Math.ceil(analyses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAnalyses = useMemo(
    () => analyses.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [analyses, currentPage, pageSize],
  );

  const analyzeMutation = useMutation({
    mutationFn: (input: NewBillingAnalysisInput) => runBillingAnalysis(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey });
      toast.success("Análise concluída.");
    },
    // A falha é comunicada dentro do modal, que oferece "Tentar novamente".
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey });
    },
  });

  function handleSubmit(input: NewBillingAnalysisInput) {
    setPage(1);
    return analyzeMutation.mutateAsync(input);
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
                  disabled={analyzeMutation.isPending}
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
                  <TableSkeleton rows={4} columns={6} />
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
                                <AnalysisResultBadge
                                  analysis={analysis}
                                  onOpen={setResultAnalysis}
                                />
                              </DataTableCell>
                              <DataTableCell className="text-right">
                                <AnalysisActions analysis={analysis} />
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
                              <AnalysisResultBadge analysis={analysis} onOpen={setResultAnalysis} />
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
                            <AnalysisActions analysis={analysis} />
                          </DataTableCardActions>
                        </DataTableCard>
                      ))}
                    </DataTableCardList>

                    <TablePagination
                      id="billing-analyses"
                      totalItems={analyses.length}
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
            </section>
          </main>

          <SiteFooter />
        </div>
      </div>

      <NewBillingAnalysisModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
      />
      <AnalysisResultModal analysis={resultAnalysis} onClose={() => setResultAnalysis(null)} />
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
function AnalysisResultBadge({
  analysis,
  onOpen,
}: {
  analysis: BillingAnalysis;
  onOpen: (analysis: BillingAnalysis) => void;
}) {
  const hasDivergent = analysis.divergenceCount > 0;
  const hasUnanalyzed = analysis.unanalyzedCount > 0;
  const actionable = analysis.status === "completed" && (hasDivergent || hasUnanalyzed);

  const badge = (
    <Badge variant={analysisResultBadgeVariant(analysis)} size="sm" className="shrink-0">
      {analysisResultLabel(analysis)}
    </Badge>
  );

  if (actionable) {
    const hint =
      hasDivergent && hasUnanalyzed
        ? "Ver itens que exigem atenção"
        : hasDivergent
          ? "Ver divergências"
          : "Ver itens não analisados";
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onOpen(analysis)}
            aria-label={`${analysisResultLabel(analysis)}. ${hint}`}
            className="inline-flex cursor-pointer rounded-full outline-none transition hover:opacity-80 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            {badge}
          </button>
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    );
  }

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

/** Ações da linha: visualizar o resultado detalhado (interface na próxima etapa). */
function AnalysisActions({ analysis }: { analysis: BillingAnalysis }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon">
            <Link
              to="/analise-faturamento/$analysisId"
              params={{ analysisId: analysis.id }}
              aria-label={`Visualizar análise completa de ${analysis.fileName}`}
            >
              <Eye className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar análise completa</TooltipContent>
      </Tooltip>
    </div>
  );
}
