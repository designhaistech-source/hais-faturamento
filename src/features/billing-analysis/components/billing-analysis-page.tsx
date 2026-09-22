import { useMemo, useState } from "react";
import { Eye, FileSearch, Plus } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/empty-state-card";
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
import {
  analysisResultBadgeVariant,
  analysisResultLabel,
  formatAnalysisDateTime,
  readAnalysisPartiesFromXml,
  type BillingAnalysis,
} from "../data/billing-analyses";

const COLUMNS = [
  "Arquivo",
  "Prestador",
  "Operadora",
  "Data da análise",
  "Resultado",
  "Ações",
] as const;

/**
 * Análise de faturamento: cabeçalho, listagem das análises e envio do XML TISS.
 * O processamento do XML e o resultado detalhado serão implementados depois.
 */
export function BillingAnalysisPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [analyses, setAnalyses] = useState<BillingAnalysis[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const handleNewAnalysis = () => setModalOpen(true);

  const totalPages = Math.max(1, Math.ceil(analyses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedAnalyses = useMemo(
    () => analyses.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [analyses, currentPage, pageSize],
  );

  async function handleSubmit(input: NewBillingAnalysisInput) {
    const { file } = input;
    const parties = await readAnalysisPartiesFromXml(file);
    const analysis: BillingAnalysis = {
      id: crypto.randomUUID(),
      contractId: input.contractId,
      contractCompany: input.contractCompany,
      fileName: file.name,
      provider: parties.provider,
      healthPlan: parties.healthPlan,
      analyzedAt: new Date().toISOString(),
      status: "processing",
    };
    setAnalyses((previous) => [analysis, ...previous]);
    setPage(1);
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
                <Button type="button" className="w-full sm:w-auto" onClick={handleNewAnalysis}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nova análise
                </Button>
              }
            />

            <section className="space-y-4">
              {analyses.length === 0 ? (
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
                              <DataTableCell className="max-w-80">
                                <AnalysisFileName name={analysis.fileName} />
                              </DataTableCell>
                              <DataTableCell>{analysis.provider}</DataTableCell>
                              <DataTableCell>{analysis.healthPlan}</DataTableCell>
                              <DataTableCell>
                                {formatAnalysisDateTime(analysis.analyzedAt)}
                              </DataTableCell>
                              <DataTableCell>
                                <AnalysisResultBadge analysis={analysis} />
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
                            title={<AnalysisResultBadge analysis={analysis} />}
                            subtitle={analysis.fileName}
                          />
                          <DataTableCardFields
                            className="gap-x-4 gap-y-1"
                            fields={[
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
        onSubmit={(input) => void handleSubmit(input)}
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

/** Resultado da análise: divergências encontradas, sem divergências ou processando. */
function AnalysisResultBadge({ analysis }: { analysis: BillingAnalysis }) {
  return (
    <Badge variant={analysisResultBadgeVariant(analysis)} size="sm" className="shrink-0">
      {analysisResultLabel(analysis)}
    </Badge>
  );
}

/** Ações da linha: visualizar o resultado detalhado (implementação posterior). */
function AnalysisActions({ analysis }: { analysis: BillingAnalysis }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Visualizar análise de ${analysis.fileName}`}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar análise</TooltipContent>
      </Tooltip>
    </div>
  );
}
