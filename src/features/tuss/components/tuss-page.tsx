import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Download, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
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

import { NewTussVersionModal } from "./new-tuss-version-modal";
import {
  currentTussTableIds,
  formatTussDateTime,
  TUSS_TABLE_NUMBERS,
  tussTableLabel,
  type NewTussVersionInput,
  type TussVersion,
} from "../data/tuss-versions";

const TABLE_FILTER_OPTIONS = [
  { value: "all", label: "Todas as tabelas" },
  ...TUSS_TABLE_NUMBERS.map((number) => ({ value: String(number), label: tussTableLabel(number) })),
];
import {
  createTussVersion,
  createTussVersionFileUrl,
  deleteAllTussVersions,
  listTussVersions,
  tussVersionsQueryKey,
} from "../data/tuss-versions-service";

const COLUMNS = ["Arquivo", "Tabela TUSS", "Cadastrado por", "Data do cadastro", "Ações"] as const;

async function downloadVersionFile(version: TussVersion) {
  try {
    for (const file of version.files) {
      const url = await createTussVersionFileUrl(file.path, file.name);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch {
    toast.error("Não foi possível baixar o arquivo desta versão.");
  }
}

export function TussPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  /** Ferramenta provisória de testes: simula a página sem versões, sem alterar dados. */
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const queryClient = useQueryClient();

  const versionsQuery = useQuery({ queryKey: tussVersionsQueryKey, queryFn: listTussVersions });
  const storedVersions = versionsQuery.data ?? [];
  const versions = simulateEmpty ? [] : storedVersions;
  const currentIds = useMemo(() => currentTussTableIds(versions), [versions]);

  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const activeCount = [
    search.trim() !== "",
    tableFilter !== "all",
    createdFrom !== "",
    createdTo !== "",
  ].filter(Boolean).length;
  const hasFilters = activeCount > 0;

  const filteredVersions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return versions.filter((version) => {
      if (term && !version.files.some((file) => file.name.toLowerCase().includes(term)))
        return false;
      if (tableFilter !== "all" && String(version.tableName) !== tableFilter) return false;
      if (createdFrom || createdTo) {
        const created = new Date(version.createdAt);
        if (Number.isNaN(created.getTime())) return false;
        const createdDay = toLocalIsoDate(created);
        if (createdFrom && createdDay < createdFrom) return false;
        if (createdTo && createdDay > createdTo) return false;
      }
      return true;
    });
  }, [versions, search, tableFilter, createdFrom, createdTo]);

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
    setTableFilter("all");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
  }

  const backgroundTask = useBackgroundTask();

  // Runs in the global background task so it survives navigation; the task card is the only feedback.
  function startTableProcessing(input: NewTussVersionInput) {
    backgroundTask.start({
      kind: "tuss-table",
      fileName:
        input.files.length === 1
          ? (input.files[0]?.name ?? "")
          : `${input.files[0]?.name ?? ""} + ${input.files.length - 1} arquivo(s)`,
      processing: {
        title: "Processando tabela TUSS",
        description: "Processando os dados da tabela...",
      },
      failure: {
        title: "Não foi possível processar a tabela",
        description: "Não foi possível processar o arquivo.",
      },
      retryable: true,
      run: async () => {
        await createTussVersion(input);
        await queryClient.invalidateQueries({ queryKey: tussVersionsQueryKey });
        setPage(1);
        return {
          title: "Tabela processada",
          description: "Os dados da tabela TUSS estão disponíveis para uso.",
        };
      },
    });
  }

  const clearMutation = useMutation({
    mutationFn: deleteAllTussVersions,
    onSuccess: async () => {
      setClearOpen(false);
      await queryClient.invalidateQueries({ queryKey: tussVersionsQueryKey });
      setPage(1);
      toast.success("Tabelas cadastradas removidas.");
    },
    onError: () => {
      toast.error("Não foi possível limpar as tabelas cadastradas.");
    },
  });

  const newVersionButton = (
    <Button type="button" onClick={() => setModalOpen(true)}>
      <Plus className="size-4" aria-hidden="true" />
      Nova tabela
    </Button>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="tuss" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="TUSS"
              description="Gerencie as versões das terminologias utilizadas na identificação e classificação dos itens do faturamento."
              actions={
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Nova tabela
                </Button>
              }
            />

            <section className="space-y-4">
              {versionsQuery.isPending ? (
                <SurfaceCard padding="none">
                  <TableSkeleton rows={4} columns={5} />
                </SurfaceCard>
              ) : versionsQuery.isError ? (
                <SurfaceCard padding="md">
                  <ErrorState
                    title="Não foi possível carregar as tabelas"
                    description="Tente novamente em alguns instantes."
                    onRetry={() => void versionsQuery.refetch()}
                  />
                </SurfaceCard>
              ) : versions.length === 0 ? (
                <EmptyStateCard
                  icon={<BookMarked className="size-10" aria-hidden="true" />}
                  title="Nenhuma tabela cadastrada"
                  description="Cadastre uma tabela TUSS para começar."
                  action={newVersionButton}
                />
              ) : (
                <>
                  <FilterCard
                    id="tuss-versions-filters"
                    variant="bar"
                    activeCount={activeCount}
                    onClear={handleClearFilters}
                    clearDisabled={!hasFilters}
                    barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_16rem_22rem_auto] lg:gap-4"
                  >
                    <SearchField
                      id="tuss-versions-search"
                      label="Buscar"
                      fieldClassName="sm:col-span-2 lg:col-span-1"
                      placeholder="Buscar por arquivo"
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
                      id="tuss-versions-table"
                      label="Tabela TUSS"
                      className="sm:col-span-2 lg:col-span-1"
                      value={tableFilter}
                      options={TABLE_FILTER_OPTIONS}
                      onValueChange={(value) => {
                        setTableFilter(value);
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
                          id="tuss-versions-created-from"
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
                          id="tuss-versions-created-to"
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
                      icon={<BookMarked className="size-10" aria-hidden="true" />}
                      title="Nenhuma tabela encontrada"
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
                              {paginatedVersions.map((version) => (
                                <DataTableRow key={version.id}>
                                  <DataTableCell className="max-w-96">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <VersionFileName files={version.files} />
                                      {currentIds.has(version.id) && <CurrentBadge />}
                                    </div>
                                  </DataTableCell>
                                  <DataTableCell>{tussTableLabel(version.tableName)}</DataTableCell>
                                  <DataTableCell>{version.createdBy}</DataTableCell>
                                  <DataTableCell>
                                    {formatTussDateTime(version.createdAt)}
                                  </DataTableCell>
                                  <DataTableCell className="text-right">
                                    <VersionActions version={version} />
                                  </DataTableCell>
                                </DataTableRow>
                              ))}
                            </DataTableBody>
                          </DataTableRoot>
                        </DataTableDesktop>

                        <DataTableCardList divided>
                          {paginatedVersions.map((version) => (
                            <DataTableCard key={version.id} flat className="space-y-1.5 py-2.5">
                              <DataTableCardHeader
                                title={
                                  <>
                                    <span>{tussTableLabel(version.tableName)}</span>
                                    {currentIds.has(version.id) && <CurrentBadge />}
                                  </>
                                }
                                subtitle={version.files.map((file) => file.name).join(", ")}
                              />
                              <DataTableCardFields
                                className="gap-x-4 gap-y-1"
                                fields={[
                                  { label: "Cadastrado por", value: version.createdBy },
                                  {
                                    label: "Data do cadastro",
                                    value: formatTussDateTime(version.createdAt),
                                  },
                                ]}
                              />
                              <DataTableCardActions className="-mt-0.5 justify-end">
                                <VersionActions version={version} />
                              </DataTableCardActions>
                            </DataTableCard>
                          ))}
                        </DataTableCardList>

                        <TablePagination
                          id="tuss-versions"
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
            {storedVersions.length > 0 && (
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
                    className="text-xs text-muted-foreground hover:text-destructive"
                    disabled={clearMutation.isPending}
                    onClick={() => setClearOpen(true)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Limpar tabelas cadastradas · Temporário
                  </Button>
                )}
              </div>
            )}
          </main>

          <SiteFooter />
        </div>
      </div>

      <NewTussVersionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreate={startTableProcessing}
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Limpar tabelas cadastradas?"
        description="Esta ação apagará todas as tabelas TUSS e seus arquivos. Deseja continuar?"
        confirmLabel="Limpar tabelas"
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

/** Nome do arquivo truncado, com o valor completo em tooltip (mouse e teclado). */
function VersionFileName({ files }: { files: TussVersion["files"] }) {
  const [first] = files;
  const extra = files.length - 1;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="flex min-w-0 items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="min-w-0 truncate">{first?.name ?? "—"}</span>
          {extra > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              +{extra} {extra === 1 ? "arquivo" : "arquivos"}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 break-all">
        {files.length > 1 ? (
          <ul className="space-y-0.5">
            {files.map((file) => (
              <li key={file.path}>{file.name}</li>
            ))}
          </ul>
        ) : (
          first?.name
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function VersionActions({ version }: { version: TussVersion }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              version.files.length > 1
                ? `Baixar ${version.files.length} arquivos de ${tussTableLabel(version.tableName)}`
                : `Baixar ${version.file.name}`
            }
            onClick={() => void downloadVersionFile(version)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {version.files.length > 1 ? "Baixar arquivos" : "Baixar arquivo"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
