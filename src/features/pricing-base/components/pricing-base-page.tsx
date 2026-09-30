import { Fragment, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zipSync } from "fflate";
import {
  Database,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  FileSearch,
  ClipboardList,
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
import { ImportStatusBadge, ImportSummaryModal } from "./import-status";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos os status" },
  ...IMPORT_STATUSES.map((status) => ({ value: status, label: IMPORT_STATUS_LABEL[status] })),
];
import { AddPricingBaseModal } from "./add-pricing-base-modal";
import {
  currentVersionIdsByType,
  hasBrowsableDetails,
  formatVersionDateTime,
  pricingBaseTypeLabel,
  PRICING_BASE_TYPES,
  type NewPricingVersionInput,
  type PricingBaseType,
  type PricingVersion,
  type PricingVersionFile,
} from "../data/pricing-versions";
import {
  addPricingVersionUpdate,
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

  /** Versão "Atual" de cada tipo, usada pelo fluxo de atualização incremental. */
  const currentVersionsByType = useMemo(() => {
    const ids = currentVersionIdsByType(storedVersions);
    const map = new Map<PricingBaseType, PricingVersion>();
    for (const version of storedVersions) {
      if (ids.has(version.id)) map.set(version.baseType, version);
    }
    return map;
  }, [storedVersions]);

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

  const backgroundTask = useBackgroundTask();

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

  function startBaseUpdate(version: PricingVersion, file: File) {
    backgroundTask.start({
      kind: "pricing-base",
      fileName: file.name,
      processing: {
        title: "Processando atualização da base",
        description: "Processando os dados da atualização...",
      },
      failure: {
        title: "Não foi possível processar a atualização",
        description: "Não foi possível processar o arquivo.",
      },
      retryable: true,
      run: async () => {
        const status = await addPricingVersionUpdate(version, file);
        await queryClient.invalidateQueries({ queryKey: pricingVersionsQueryKey });
        if (status !== "COMPLETED") {
          return {
            tone: "danger",
            title: "Atualização não aplicada",
            description: `O arquivo não foi adicionado à versão atual da ${pricingBaseTypeLabel(version.baseType)} porque a importação não foi concluída.`,
          };
        }
        return {
          title: "Atualização adicionada",
          description: `O arquivo foi adicionado à versão atual da ${pricingBaseTypeLabel(version.baseType)}.`,
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
                  Adicionar
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
                    barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_11rem_11rem] lg:gap-4 xl:min-[1440px]:grid-cols-[minmax(10rem,1fr)_12rem_11rem_22rem_auto]"
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
                        <DataTableDesktop breakpoint="lg">
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
                                return (
                                  <Fragment key={version.id}>
                                    <DataTableRow>
                                      <DataTableCell>
                                        <div className="flex min-w-0 max-w-60 2xl:max-w-96 items-center gap-2">
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
                                          onShowSummary={setDetailsVersion}
                                        />
                                      </DataTableCell>
                                    </DataTableRow>
                                  </Fragment>
                                );
                              })}
                            </DataTableBody>
                          </DataTableRoot>
                        </DataTableDesktop>

                        <DataTableCardList breakpoint="lg" divided>
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

                              <DataTableCardActions className="-mt-0.5 justify-end">
                                <VersionActions
                                  version={version}
                                  onShowSummary={setDetailsVersion}
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

      <AddPricingBaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        existingBaseTypes={existingBaseTypes}
        currentVersions={currentVersionsByType}
        onCreate={startBaseProcessing}
        onUpdate={startBaseUpdate}
      />

      <ImportSummaryModal
        version={detailsVersion}
        hasCurrentVersion={
          detailsVersion !== null && currentVersionsByType.has(detailsVersion.baseType)
        }
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
  return <span className="shrink-0 text-xs font-medium text-primary">Atual</span>;
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

/** Ações da linha: resumo, detalhes da importação e download do(s) arquivo(s). */
function VersionActions({
  version,
  onShowSummary,
}: {
  version: PricingVersion;
  onShowSummary: (version: PricingVersion) => void;
}) {
  const browsable = hasBrowsableDetails(version);
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Ver resumo da importação de ${version.file.name}`}
            onClick={() => onShowSummary(version)}
          >
            <FileSearch className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ver resumo da importação</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Span keeps the tooltip reachable when the button is disabled. */}
          <span tabIndex={browsable ? -1 : 0} className="inline-flex">
            {browsable ? (
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label={`Ver detalhes da importação de ${version.file.name}`}
              >
                <Link to="/base-precificacao/$versionId" params={{ versionId: version.id }}>
                  <ClipboardList className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled
                aria-label={`Detalhes indisponíveis para ${version.file.name}. A importação não foi concluída.`}
              >
                <ClipboardList className="size-4" aria-hidden="true" />
              </Button>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {browsable
            ? "Ver detalhes da importação"
            : "Detalhes indisponíveis. A importação não foi concluída."}
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
          {version.files.length > 1 ? "Baixar arquivos (.zip)" : "Baixar arquivo"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
