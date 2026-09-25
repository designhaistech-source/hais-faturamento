import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zipSync } from "fflate";
import {
  ChevronRight,
  Database,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  FileSearch,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { useBackgroundTask } from "@/components/background-task";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState, TableSkeleton } from "@/components/data-state";
import { SurfaceCard } from "@/components/surface-card";
import { FilterCard } from "@/components/filter-card";
import { SearchField, SelectField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { toLocalIsoDate } from "@/lib/date";
import { cn } from "@/lib/utils";
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

import { IMPORT_STATUSES, IMPORT_STATUS_LABEL, type ImportStatus } from "../data/pricing-import";
import { ImportDetailsModal, ImportStatusBadge } from "./import-status";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos os status" },
  ...IMPORT_STATUSES.map((status) => ({ value: status, label: IMPORT_STATUS_LABEL[status] })),
];
import { NewPricingVersionModal } from "./new-pricing-version-modal";
import {
  currentVersionIdsByType,
  formatVersionDateTime,
  pricingBaseTypeLabel,
  PRICING_BASE_TYPES,
  type NewPricingVersionInput,
  type PricingBaseType,
  type PricingVersion,
  type PricingVersionFile,
} from "../data/pricing-versions";
import {
  createPricingVersion,
  createPricingVersionFileUrl,
  deleteAllPricingVersions,
  downloadPricingVersionBlob,
  listPricingVersions,
  pricingVersionsQueryKey,
} from "../data/pricing-versions-service";

const COLUMNS = [
  "Arquivo",
  "Tipo da base",
  "Cadastrado por",
  "Data do cadastro",
  "Status",
  "Ações",
] as const;

function triggerDownload(href: string, name: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Baixa um único arquivo da versão. */
async function downloadSingleFile(file: PricingVersionFile) {
  try {
    triggerDownload(await createPricingVersionFileUrl(file.path, file.name), file.name);
  } catch {
    toast.error("Não foi possível baixar o arquivo.");
  }
}

/** Download da versão completa: o próprio arquivo, ou um .zip quando há vários. */
async function downloadVersionFile(version: PricingVersion) {
  if (version.files.length <= 1) return downloadSingleFile(version.file);
  try {
    const entries: Record<string, Uint8Array> = {};
    for (const file of version.files) {
      const blob = await downloadPricingVersionBlob(file.path);
      let name = file.name;
      for (let copy = 2; name in entries; copy += 1) name = `${copy}-${file.name}`;
      entries[name] = new Uint8Array(await blob.arrayBuffer());
    }
    const zipped = zipSync(entries);
    const url = URL.createObjectURL(new Blob([zipped.slice().buffer], { type: "application/zip" }));
    const day = version.createdAt.slice(0, 10);
    triggerDownload(url, `${version.baseType}-${day}.zip`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    toast.error("Não foi possível baixar os arquivos desta versão.");
  }
}

export function PricingBasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsVersion, setDetailsVersion] = useState<PricingVersion | null>(null);
  const queryClient = useQueryClient();

  const versionsQuery = useQuery({
    queryKey: pricingVersionsQueryKey,
    queryFn: listPricingVersions,
  });
  const storedVersions = versionsQuery.data ?? [];
  const [clearOpen, setClearOpen] = useState(false);
  /** Ferramenta provisória de testes: simula a página sem versões, sem alterar dados. */
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const versions = simulateEmpty ? [] : storedVersions;
  const currentVersionIds = useMemo(() => currentVersionIdsByType(versions), [versions]);
  /** Tipos que já possuem versão cadastrada (independe da simulação de estado vazio). */
  const existingBaseTypes = useMemo(
    () => Array.from(new Set(storedVersions.map((version) => version.baseType))),
    [storedVersions],
  );

  const [search, setSearch] = useState("");
  const [baseTypeFilter, setBaseTypeFilter] = useState<"all" | PricingBaseType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ImportStatus>("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const activeCount = [
    search.trim() !== "",
    baseTypeFilter !== "all",
    statusFilter !== "all",
    createdFrom !== "",
    createdTo !== "",
  ].filter(Boolean).length;
  const hasFilters = activeCount > 0;

  const filteredVersions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return versions.filter((version) => {
      if (term && !version.files.some((file) => file.name.toLowerCase().includes(term))) {
        return false;
      }
      if (baseTypeFilter !== "all" && version.baseType !== baseTypeFilter) return false;
      if (statusFilter !== "all" && version.importStatus !== statusFilter) return false;
      if (createdFrom || createdTo) {
        const created = new Date(version.createdAt);
        if (Number.isNaN(created.getTime())) return false;
        const createdDay = toLocalIsoDate(created);
        if (createdFrom && createdDay < createdFrom) return false;
        if (createdTo && createdDay > createdTo) return false;
      }
      return true;
    });
  }, [versions, search, baseTypeFilter, statusFilter, createdFrom, createdTo]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(filteredVersions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedVersions = useMemo(
    () => filteredVersions.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredVersions, currentPage, pageSize],
  );

  function handleClearFilters() {
    setSearch("");
    setBaseTypeFilter("all");
    setStatusFilter("all");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
  }

  const baseTypeOptions = useMemo(
    () => [
      { value: "all", label: "Todos os tipos" },
      ...PRICING_BASE_TYPES.map((type) => ({
        value: type,
        label: pricingBaseTypeLabel(type),
      })),
    ],
    [],
  );

  // Expanding is presentation only: it never touches filters, pagination or status.
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());
  const hasMultiFileRow = paginatedVersions.some((version) => version.files.length > 1);
  function toggleExpanded(id: string) {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const backgroundTask = useBackgroundTask();

  // Runs in the global background task so it survives navigation; the task card is the only feedback.
  function startBaseProcessing(input: NewPricingVersionInput) {
    // Simulação provisória vale só para um cadastro e é desligada em seguida.
    const failNext = simulateFailure;
    setSimulateFailure(false);
    backgroundTask.start({
      kind: "pricing-base",
      fileName:
        input.files.length > 1
          ? `${input.files[0].name} +${input.files.length - 1} ${input.files.length === 2 ? "arquivo" : "arquivos"}`
          : (input.files[0]?.name ?? ""),
      processing: {
        title: "Processando base de precificação",
        description: "Processando os dados da base...",
      },
      failure: {
        title: "Não foi possível processar a base",
        description: "Não foi possível processar o arquivo.",
      },
      retryable: true,
      run: async () => {
        const status = await createPricingVersion(input, { simulateFailure: failNext });
        await queryClient.invalidateQueries({ queryKey: pricingVersionsQueryKey });
        setPage(1);
        if (status === "COMPLETED_WITH_ERRORS") {
          return {
            tone: "warning",
            title: "Base processada com erros",
            description:
              "O arquivo foi processado, mas a nova versão não se tornou a versão atual. Consulte os detalhes da importação.",
          };
        }
        if (status !== "COMPLETED") {
          return {
            tone: "danger",
            title: "Importação não concluída",
            description: "Consulte os detalhes da importação na lista de versões.",
          };
        }
        return {
          title: "Base de precificação cadastrada",
          description: "A nova versão está disponível para uso.",
        };
      },
    });
  }

  const clearMutation = useMutation({
    mutationFn: deleteAllPricingVersions,
    onSuccess: async () => {
      setClearOpen(false);
      await queryClient.invalidateQueries({ queryKey: pricingVersionsQueryKey });
      setPage(1);
      toast.success("Versões cadastradas removidas.");
    },
    onError: () => {
      toast.error("Não foi possível limpar as versões cadastradas.");
    },
  });

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="base-precificacao" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Base de precificação"
              description="Gerencie as bases de valores utilizadas na análise do faturamento."
              actions={
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Nova versão
                </Button>
              }
            />

            <section className="space-y-4">
              {versionsQuery.isPending ? (
                <SurfaceCard padding="none">
                  <TableSkeleton rows={4} columns={6} />
                </SurfaceCard>
              ) : versionsQuery.isError ? (
                <SurfaceCard padding="md">
                  <ErrorState
                    title="Não foi possível carregar as versões"
                    description="Tente novamente em alguns instantes."
                    onRetry={() => void versionsQuery.refetch()}
                  />
                </SurfaceCard>
              ) : versions.length === 0 ? (
                <EmptyStateCard
                  icon={<Database className="size-10" aria-hidden="true" />}
                  title="Nenhuma base cadastrada"
                  description="Cadastre uma versão de uma base de precificação para começar."
                  action={
                    <Button type="button" onClick={() => setModalOpen(true)}>
                      <Plus className="size-4" aria-hidden="true" />
                      Nova versão
                    </Button>
                  }
                />
              ) : (
                <>
                  <FilterCard
                    id="pricing-versions-filters"
                    variant="bar"
                    activeCount={activeCount}
                    onClear={handleClearFilters}
                    clearDisabled={!hasFilters}
                    // Mesmas colunas de Análise de faturamento; linha única a partir de 1440px, onde cabem todos os filtros.
                    barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_11rem_11rem] lg:gap-4 min-[1440px]:grid-cols-[minmax(10rem,1fr)_12rem_11rem_22rem_auto]"
                  >
                    <SearchField
                      id="pricing-versions-search"
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
                      id="pricing-versions-base-type"
                      label="Tipo da base"
                      className="sm:col-span-2 lg:col-span-1"
                      value={baseTypeFilter}
                      options={baseTypeOptions}
                      onValueChange={(value) => {
                        setBaseTypeFilter(value as "all" | PricingBaseType);
                        setPage(1);
                      }}
                    />
                    <SelectField
                      id="pricing-versions-status"
                      label="Status"
                      className="sm:col-span-2 lg:col-span-1"
                      value={statusFilter}
                      options={STATUS_FILTER_OPTIONS}
                      onValueChange={(value) => {
                        setStatusFilter(value as "all" | ImportStatus);
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
                          id="pricing-versions-created-from"
                          type="date"
                          aria-label="Data do cadastro de"
                          className="min-w-0 flex-1"
                          value={createdFrom}
                          max={createdTo || undefined}
                          onChange={(event) => {
                            setCreatedFrom(event.target.value);
                            setPage(1);
                          }}
                        />
                        <span className="shrink-0 text-xs text-muted-foreground">até</span>
                        <Input
                          id="pricing-versions-created-to"
                          type="date"
                          aria-label="Data do cadastro até"
                          className="min-w-0 flex-1"
                          value={createdTo}
                          min={createdFrom || undefined}
                          onChange={(event) => {
                            setCreatedTo(event.target.value);
                            setPage(1);
                          }}
                        />
                      </div>
                    </fieldset>
                  </FilterCard>

                  {filteredVersions.length === 0 ? (
                    <EmptyStateCard
                      icon={<Database className="size-10" aria-hidden="true" />}
                      title="Nenhuma versão encontrada"
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
                        Histórico de versões
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
                              {paginatedVersions.map((version) => {
                                const multi = version.files.length > 1;
                                const expanded = multi && expandedIds.has(version.id);
                                return (
                                  <Fragment key={version.id}>
                                    <DataTableRow>
                                      <DataTableCell className="max-w-96">
                                        <div className="flex min-w-0 items-center gap-2">
                                          {multi ? (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="-my-1 -ml-3 size-10 shrink-0 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                              aria-expanded={expanded}
                                              aria-controls={`pricing-version-files-${version.id}`}
                                              aria-label={
                                                expanded
                                                  ? `Recolher arquivos de ${version.file.name}`
                                                  : `Expandir arquivos de ${version.file.name}`
                                              }
                                              onClick={() => toggleExpanded(version.id)}
                                            >
                                              <ChevronRight
                                                className={cn(
                                                  "size-4 transition-transform motion-reduce:transition-none",
                                                  expanded && "rotate-90",
                                                )}
                                                aria-hidden="true"
                                              />
                                            </Button>
                                          ) : (
                                            hasMultiFileRow && (
                                              <span
                                                className="-ml-3 size-10 shrink-0"
                                                aria-hidden="true"
                                              />
                                            )
                                          )}
                                          <VersionFileName version={version} />
                                          {currentVersionIds.has(version.id) && <CurrentBadge />}
                                        </div>
                                      </DataTableCell>
                                      <DataTableCell>
                                        <Badge variant="info-soft" size="sm" className="shrink-0">
                                          {pricingBaseTypeLabel(version.baseType)}
                                        </Badge>
                                      </DataTableCell>
                                      <DataTableCell>{version.createdBy}</DataTableCell>
                                      <DataTableCell>
                                        {formatVersionDateTime(version.createdAt)}
                                      </DataTableCell>

                                      <DataTableCell>
                                        <ImportStatusBadge status={version.importStatus} />
                                      </DataTableCell>
                                      <DataTableCell className="text-right">
                                        <VersionActions
                                          version={version}
                                          onShowDetails={setDetailsVersion}
                                        />
                                      </DataTableCell>
                                    </DataTableRow>
                                    {expanded &&
                                      version.files.map((file, index) => (
                                        <DataTableRow
                                          key={file.path}
                                          id={
                                            index === 0
                                              ? `pricing-version-files-${version.id}`
                                              : undefined
                                          }
                                          className="bg-muted/40"
                                        >
                                          <DataTableCell colSpan={5} className="py-1">
                                            <div className="flex min-w-0 items-center gap-2 pl-8 before:h-4 before:w-3 before:shrink-0 before:border-b before:border-l before:border-border before:content-['']">
                                              <Paperclip
                                                className="size-4 shrink-0 text-muted-foreground"
                                                aria-hidden="true"
                                              />
                                              <span className="min-w-0 break-all text-sm">
                                                {file.name}
                                              </span>
                                            </div>
                                          </DataTableCell>
                                          <DataTableCell className="py-1 text-right">
                                            <FileDownloadButton file={file} />
                                          </DataTableCell>
                                        </DataTableRow>
                                      ))}
                                  </Fragment>
                                );
                              })}
                            </DataTableBody>
                          </DataTableRoot>
                        </DataTableDesktop>

                        <DataTableCardList divided>
                          {paginatedVersions.map((version) => (
                            <DataTableCard key={version.id} flat className="space-y-1.5 py-2.5">
                              <DataTableCardHeader
                                title={
                                  <>
                                    <Badge variant="info-soft" size="sm" className="shrink-0">
                                      {pricingBaseTypeLabel(version.baseType)}
                                    </Badge>
                                    {currentVersionIds.has(version.id) && <CurrentBadge />}
                                  </>
                                }
                                subtitle={<VersionFileName version={version} />}
                              />
                              <DataTableCardFields
                                className="gap-x-4 gap-y-1"
                                fields={[
                                  { label: "Cadastrado por", value: version.createdBy },
                                  {
                                    label: "Data do cadastro",
                                    value: formatVersionDateTime(version.createdAt),
                                  },
                                  {
                                    label: "Status",
                                    value: <ImportStatusBadge status={version.importStatus} />,
                                  },
                                ]}
                              />

                              {version.files.length > 1 && (
                                <details className="group rounded-lg border border-border">
                                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground">
                                    <ChevronRight
                                      className="size-4 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                                      aria-hidden="true"
                                    />
                                    {version.files.length} arquivos nesta versão
                                  </summary>
                                  <ul className="divide-y divide-border border-t border-border">
                                    {version.files.map((file) => (
                                      <li
                                        key={file.path}
                                        className="flex min-w-0 items-center gap-2 py-1 pl-4 pr-1"
                                      >
                                        <span className="min-w-0 flex-1 break-all text-sm">
                                          {file.name}
                                        </span>
                                        <FileDownloadButton file={file} />
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              )}

                              <DataTableCardActions className="-mt-0.5 justify-end">
                                <VersionActions
                                  version={version}
                                  onShowDetails={setDetailsVersion}
                                />
                              </DataTableCardActions>
                            </DataTableCard>
                          ))}
                        </DataTableCardList>

                        <TablePagination
                          id="pricing-versions"
                          totalItems={filteredVersions.length}
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
            <div className="flex flex-wrap justify-end gap-2 border-t border-dashed border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                aria-pressed={simulateFailure}
                onClick={() => setSimulateFailure((previous) => !previous)}
              >
                <FlaskConical className="size-3.5" aria-hidden="true" />
                {simulateFailure
                  ? "Simulação de falha ativa: próximo cadastro terá Falha na importação · Temporário"
                  : "Simular Falha na importação no próximo cadastro · Temporário"}
              </Button>
            </div>
            {storedVersions.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
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
                    className="text-xs text-muted-foreground hover:text-destructive"
                    disabled={clearMutation.isPending}
                    onClick={() => setClearOpen(true)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Limpar versões cadastradas · Temporário
                  </Button>
                )}
              </div>
            )}
          </main>

          <SiteFooter />
        </div>
      </div>

      <NewPricingVersionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        existingBaseTypes={existingBaseTypes}
        onCreate={startBaseProcessing}
      />

      <ImportDetailsModal
        version={detailsVersion}
        onOpenChange={(open) => {
          if (!open) setDetailsVersion(null);
        }}
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Limpar versões cadastradas?"
        description="Esta ação apagará todas as versões da base de precificação e seus arquivos. Deseja continuar?"
        confirmLabel="Limpar versões"
        onConfirm={() => clearMutation.mutate()}
      />
    </TooltipProvider>
  );
}

function CurrentBadge() {
  return (
    <Badge variant="success-soft" size="sm" className="shrink-0">
      Atual
    </Badge>
  );
}

/** Nome do primeiro arquivo truncado + "+N arquivos"; a lista completa fica em tooltip. */
function VersionFileName({ version }: { version: PricingVersion }) {
  const extra = version.files.length - 1;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="flex min-w-0 items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="min-w-0 truncate">{version.file.name}</span>
          {extra > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              +{extra} {extra === 1 ? "arquivo" : "arquivos"}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 break-all">
        {extra > 0 ? (
          <ul className="space-y-0.5">
            {version.files.map((file) => (
              <li key={file.path}>{file.name}</li>
            ))}
          </ul>
        ) : (
          version.file.name
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/** Ações da linha: detalhes da importação e download do arquivo original. */
function VersionActions({
  version,
  onShowDetails,
}: {
  version: PricingVersion;
  onShowDetails: (version: PricingVersion) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Span keeps the tooltip reachable when the button is disabled. */}
          <span tabIndex={version.detailsAvailable ? -1 : 0} className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!version.detailsAvailable}
              aria-label={
                version.detailsAvailable
                  ? `Ver detalhes da importação de ${version.file.name}`
                  : `Detalhes da importação indisponíveis para ${version.file.name}`
              }
              onClick={() => onShowDetails(version)}
            >
              <FileSearch className="size-4" aria-hidden="true" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {version.detailsAvailable
            ? "Ver detalhes da importação"
            : "Detalhes da importação indisponíveis"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              version.files.length > 1
                ? `Baixar todos os arquivos de ${version.file.name} (.zip)`
                : `Baixar ${version.file.name}`
            }
            onClick={() => void downloadVersionFile(version)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {version.files.length > 1 ? "Baixar todos os arquivos (.zip)" : "Baixar"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function FileDownloadButton({ file }: { file: PricingVersionFile }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Baixar arquivo ${file.name}`}
          onClick={() => void downloadSingleFile(file)}
        >
          <Download className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Baixar arquivo</TooltipContent>
    </Tooltip>
  );
}
