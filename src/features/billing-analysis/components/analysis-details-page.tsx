import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  FileSearch,
  ListChecks,
  X,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppModal } from "@/components/app-modal";
import { FilterCard } from "@/components/filter-card";
import { SearchField, SelectField } from "@/components/form-field";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/data-state";
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

import { formatAnalysisDateTime, UNIDENTIFIED_LABEL } from "../data/billing-analyses";
import {
  analysisDetailsQueryKey,
  formatAdjustment,
  formatCurrency,
  formatDecimal,
  formatDifference,
  getAnalysisDetails,
  ITEM_STATUS_BADGE,
  ITEM_STATUS_LABEL,
  referenceLabel,
  summarizeItems,
  type AnalysisItemDetail,
  type AnalysisItemStatus,
  appliedRuleLabel,
  categoryLabel,
} from "../data/analysis-details";

type ResultFilter = "all" | AnalysisItemStatus;

const RESULT_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "ok", label: "Conformidades" },
  { value: "divergent", label: "Divergências" },
  { value: "unanalyzed", label: "Não analisados" },
];

const COLUMNS = [
  "Código",
  "Descrição",
  "Faturado",
  "Esperado",
  "Diferença",
  "Resultado",
  "Ações",
] as const;
const NUMERIC = new Set<string>(["Faturado", "Esperado", "Diferença"]);

export function AnalysisDetailsPage({ analysisId }: { analysisId: string }) {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<ResultFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<AnalysisItemDetail | null>(null);

  const query = useQuery({
    queryKey: analysisDetailsQueryKey(analysisId),
    queryFn: () => getAnalysisDetails(analysisId),
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const summary = useMemo(() => summarizeItems(items), [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (result === "all" || item.status === result) &&
        (!term ||
          item.code.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term)),
    );
  }, [items, search, result]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeCount = (search.trim() ? 1 : 0) + (result !== "all" ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setResult("all");
    setPage(1);
  }

  const analysis = query.data?.analysis;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="analise-faturamento" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Análise de faturamento"
              description={analysis ? analysis.fileName : undefined}
            />

            {query.isPending ? (
              <SurfaceCard padding="none">
                <TableSkeleton rows={4} columns={6} />
              </SurfaceCard>
            ) : query.isError ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Não foi possível carregar a análise"
                  description="Tente novamente em alguns instantes."
                  onRetry={() => void query.refetch()}
                />
              </SurfaceCard>
            ) : !analysis ? (
              <SurfaceCard padding="md">
                <EmptyState
                  icon={<FileSearch className="size-10" aria-hidden="true" />}
                  title="Análise não encontrada"
                  description="Ela pode ter sido removida."
                />
              </SurfaceCard>
            ) : (
              <>
                <SurfaceCard padding="md">
                  <dl className="grid grid-cols-1 gap-4 text-sm min-[380px]:grid-cols-2 lg:grid-cols-4">
                    <InfoField label="Contrato" value={analysis.contractCompany || "—"} />
                    <InfoField label="Prestador" value={analysis.provider || UNIDENTIFIED_LABEL} />
                    <InfoField
                      label="Operadora"
                      value={analysis.healthPlan || UNIDENTIFIED_LABEL}
                    />
                    <InfoField
                      label="Data da análise"
                      value={formatAnalysisDateTime(analysis.analyzedAt)}
                    />
                  </dl>
                </SurfaceCard>

                {analysis.status === "failed" && (
                  <Alert variant="destructive">
                    <XCircle className="size-4" aria-hidden="true" />
                    <AlertTitle>Análise não concluída</AlertTitle>
                    <AlertDescription>
                      {analysis.errorMessage ?? "A análise não pôde ser concluída."}
                    </AlertDescription>
                  </Alert>
                )}

                <section aria-labelledby="summary-title" className="space-y-3">
                  <h2
                    id="summary-title"
                    className="font-display text-base font-semibold tracking-tight text-foreground"
                  >
                    Resumo
                  </h2>
                  <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <SummaryTile
                      icon={<ListChecks className="size-4 text-muted-foreground" />}
                      label="Itens lidos"
                      value={summary.total}
                    />
                    <SummaryTile
                      icon={<CheckCircle2 className="size-4 text-success" />}
                      label="Conformidades"
                      value={summary.matches}
                    />
                    <SummaryTile
                      icon={<XCircle className="size-4 text-destructive" />}
                      label="Divergências"
                      value={summary.divergences}
                    />
                    <SummaryTile
                      icon={<AlertTriangle className="size-4 text-warning" />}
                      label="Não analisados"
                      value={summary.unanalyzed}
                    />
                  </ul>
                </section>

                <section aria-labelledby="items-title" className="space-y-3">
                  <h2
                    id="items-title"
                    className="font-display text-base font-semibold tracking-tight text-foreground"
                  >
                    Itens analisados
                  </h2>
                  <FilterCard
                    id="analysis-items-filters"
                    variant="bar"
                    activeCount={activeCount}
                    onClear={clearFilters}
                    clearDisabled={activeCount === 0}
                    barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:gap-4"
                  >
                    <SearchField
                      id="analysis-items-search"
                      label="Buscar"
                      placeholder="Buscar por código ou descrição"
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
                      id="analysis-items-result"
                      label="Resultado"
                      value={result}
                      options={RESULT_OPTIONS}
                      onValueChange={(value) => {
                        setResult(value as ResultFilter);
                        setPage(1);
                      }}
                    />
                  </FilterCard>

                  {filtered.length === 0 ? (
                    <SurfaceCard padding="md">
                      <EmptyState
                        title={
                          items.length === 0 ? "Nenhum item registrado" : "Nenhum item encontrado"
                        }
                        description={
                          items.length === 0
                            ? "Esta análise não possui itens persistidos."
                            : "Ajuste a busca ou o filtro de resultado."
                        }
                      />
                    </SurfaceCard>
                  ) : (
                    <DataTable>
                      <DataTableDesktop>
                        <DataTableRoot>
                          <DataTableHeader>
                            <tr>
                              {COLUMNS.map((column) => (
                                <DataTableHead
                                  key={column}
                                  className={
                                    column === "Ações" || NUMERIC.has(column)
                                      ? "text-right"
                                      : undefined
                                  }
                                >
                                  {column}
                                </DataTableHead>
                              ))}
                            </tr>
                          </DataTableHeader>
                          <DataTableBody>
                            {paginated.map((item) => (
                              <DataTableRow key={item.id}>
                                <DataTableCell className="font-mono text-xs">
                                  {item.code}
                                </DataTableCell>
                                <DataTableCell className="max-w-80">
                                  {item.description}
                                </DataTableCell>
                                <DataTableCell className="text-right font-mono text-xs">
                                  {formatCurrency(item.billedValue)}
                                </DataTableCell>
                                <DataTableCell className="text-right font-mono text-xs">
                                  {expectedOf(item)}
                                </DataTableCell>
                                <DataTableCell className="text-right font-mono text-xs">
                                  {differenceOf(item)}
                                </DataTableCell>
                                <DataTableCell>
                                  <ItemStatusBadge status={item.status} />
                                </DataTableCell>
                                <DataTableCell className="text-right">
                                  <DetailsButton item={item} onOpen={setSelected} />
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
                              title={<span className="font-mono text-xs">{item.code}</span>}
                              subtitle={item.description}
                              trailing={<ItemStatusBadge status={item.status} />}
                            />
                            <DataTableCardFields
                              className="gap-x-4 gap-y-1"
                              fields={[
                                { label: "Faturado", value: formatCurrency(item.billedValue) },
                                { label: "Esperado", value: expectedOf(item) },
                                { label: "Diferença", value: differenceOf(item) },
                              ]}
                            />
                            <DataTableCardActions className="-mt-0.5 justify-end">
                              <DetailsButton item={item} onOpen={setSelected} />
                            </DataTableCardActions>
                          </DataTableCard>
                        ))}
                      </DataTableCardList>

                      <TablePagination
                        id="analysis-items"
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
                </section>
              </>
            )}
          </main>
          <SiteFooter />
        </div>
      </div>

      <ItemDetailsModal item={selected} onClose={() => setSelected(null)} />
    </TooltipProvider>
  );
}

export function expectedOf(item: AnalysisItemDetail): string {
  return item.status === "unanalyzed" ? "—" : formatCurrency(item.expectedValue);
}

export function differenceOf(item: AnalysisItemDetail): string {
  return item.status === "unanalyzed" ? "—" : formatDifference(item.difference);
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span aria-hidden="true">{icon}</span>
        {label}
      </div>
      <p className="mt-1 font-mono text-2xl font-semibold text-foreground">{value}</p>
    </li>
  );
}

export function ItemStatusBadge({ status }: { status: AnalysisItemStatus }) {
  return (
    <Badge variant={ITEM_STATUS_BADGE[status]} size="sm" className="shrink-0">
      <ItemStatusIcon status={status} />
      {ITEM_STATUS_LABEL[status]}
    </Badge>
  );
}

export function DetailsButton({
  item,
  onOpen,
}: {
  item: AnalysisItemDetail;
  onOpen: (item: AnalysisItemDetail) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Ver detalhes do item ${item.code}`}
          onClick={() => onOpen(item)}
        >
          <ActionIcon.inspectProcessing className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Ver detalhes do item</TooltipContent>
    </Tooltip>
  );
}

export function ItemDetailsModal({
  item,
  onClose,
}: {
  item: AnalysisItemDetail | null;
  onClose: () => void;
}) {
  return (
    <AppModal
      open={item !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Detalhes do item"
      description={item ? `${item.code} · ${item.description}` : undefined}
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {item && <ItemDetailsContent item={item} />}
    </AppModal>
  );
}

/** Memória de cálculo do item, reutilizada no modal e na navegação interna do resultado. */
export function ItemDetailsContent({ item }: { item: AnalysisItemDetail }) {
  const unanalyzed = item.status === "unanalyzed";
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Resultado</span>
        <ItemStatusBadge status={item.status} />
      </div>

      {unanalyzed && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" aria-hidden="true" />
          <AlertTitle>Item não analisado</AlertTitle>
          <AlertDescription>
            {item.reason ?? "O sistema não encontrou informações suficientes para o cálculo."}
          </AlertDescription>
        </Alert>
      )}

      <DetailGroup title="Item faturado">
        <DetailRow label="Código" value={item.code} mono />
        <DetailRow label="Descrição" value={item.description} />
        <DetailRow label="Categoria identificada no XML" value={categoryLabel(item.category)} />
        <DetailRow label="Quantidade" value={formatDecimal(item.quantity)} mono />
        <DetailRow label="Valor faturado" value={formatCurrency(item.billedValue)} mono />
      </DetailGroup>

      {!unanalyzed && (
        <DetailGroup title="Como o valor esperado foi calculado">
          <DetailRow
            label="Regra contratual aplicada"
            value={appliedRuleLabel(item.ruleDescription)}
          />
          <DetailRow label="Referência utilizada" value={referenceLabel(item)} />
          {item.referenceType !== "contract" && (
            <>
              <DetailRow
                label="Valor encontrado na base"
                value={formatCurrency(item.referenceValue)}
                mono
              />
              <DetailRow label="Fator" value={formatDecimal(item.factor)} mono />
              <DetailRow
                label="Desconto ou acréscimo"
                value={formatAdjustment(item.adjustmentPercent)}
              />
            </>
          )}
          <DetailRow label="Cálculo realizado" value={item.calculation ?? "—"} mono />
          <DetailRow label="Valor esperado" value={formatCurrency(item.expectedValue)} mono />
          <DetailRow
            label="Diferença (faturado − esperado)"
            value={formatDifference(item.difference)}
            mono
          />
          {item.reason && <DetailRow label="Observação" value={item.reason} />}
        </DetailGroup>
      )}

      {unanalyzed && item.ruleDescription && (
        <DetailGroup title="Regra considerada">
          <DetailRow label="Regra contratual" value={item.ruleDescription} />
          <DetailRow label="Referência" value={referenceLabel(item)} />
        </DetailGroup>
      )}
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <dl className="divide-y divide-border rounded-xl border border-border">{children}</dl>
    </section>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-2.5 text-sm sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</dt>
      <dd
        className={
          mono
            ? "break-words font-mono text-xs text-foreground sm:text-sm"
            : "break-words text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function ItemStatusIcon({ status }: { status: AnalysisItemStatus }) {
  const Icon = status === "ok" ? Check : status === "divergent" ? X : AlertTriangle;
  return <Icon className="h-3 w-3" aria-hidden="true" />;
}
