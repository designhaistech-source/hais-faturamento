import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { appTabsListClass, appTabsTriggerClass, appTabsLabelClass } from "@/components/app-tabs";
import { ErrorState, LoadingState, TableSkeleton } from "@/components/data-state";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import { SearchField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { SurfaceCard } from "@/components/surface-card";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  importFieldLabel,
  parsePricingImportSet,
  type ImportedRecord,
  type ImportErrorRow,
} from "../data/pricing-import";
import {
  currentVersionIdsByType,
  formatVersionDateTime,
  hasBrowsableDetails,
  lastUpdateAt,
  pricingBaseTypeLabel,
  type PricingVersion,
  type PricingVersionFile,
} from "../data/pricing-versions";
import {
  createPricingVersionFileUrl,
  downloadPricingVersionBlob,
  listPricingVersions,
  pricingVersionsQueryKey,
} from "../data/pricing-versions-service";
import { ImportCallout, ImportStatusBadge, SummaryList, lineLabel } from "./import-status";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function usePaged<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    rows: items.slice(start, start + pageSize),
    pagination: {
      totalItems: items.length,
      page: current,
      pageSize,
      onPageChange: setPage,
      onPageSizeChange: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
    },
    resetPage: () => setPage(1),
  };
}

export function ImportDetailsPage({ versionId }: { versionId: string }) {
  const versionsQuery = useQuery({
    queryKey: pricingVersionsQueryKey,
    queryFn: listPricingVersions,
  });
  const versions = versionsQuery.data ?? [];
  const version = versions.find((item) => item.id === versionId) ?? null;
  const isCurrent = version !== null && currentVersionIdsByType(versions).has(version.id);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="base-precificacao" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Detalhes da importação"
              description={version?.file.name}
              actions={
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/base-precificacao">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Voltar para a base
                  </Link>
                </Button>
              }
            />
            {versionsQuery.isPending ? (
              <SurfaceCard padding="md">
                <LoadingState title="Carregando importação" />
              </SurfaceCard>
            ) : versionsQuery.isError ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Não foi possível carregar a importação"
                  description="Tente novamente em alguns instantes."
                  onRetry={() => void versionsQuery.refetch()}
                />
              </SurfaceCard>
            ) : !version ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Importação não encontrada"
                  description="Ela pode ter sido removida. Volte para a base de precificação."
                />
              </SurfaceCard>
            ) : (
              <ImportDetailsContent version={version} isCurrent={isCurrent} />
            )}
          </main>
          <SiteFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}

function ImportDetailsContent({
  version,
  isCurrent,
}: {
  version: PricingVersion;
  isCurrent: boolean;
}) {
  const browsable = hasBrowsableDetails(version);
  const recordsQuery = useQuery({
    queryKey: ["pricing-version-records", version.id, version.files.length],
    queryFn: async () => {
      const parts = await Promise.all(
        version.files.map(async (file) => ({
          name: file.name,
          content: await (await downloadPricingVersionBlob(file.path)).text(),
        })),
      );
      return parsePricingImportSet(parts, version.baseType);
    },
    enabled: browsable,
    staleTime: Infinity,
  });

  const records = recordsQuery.data?.records ?? [];
  const multi = version.files.length > 1;
  // Mesma consolidação usada nas análises: o último valor de cada código prevalece.
  const currentCodes = useMemo(() => {
    const byCode = new Map<string, ImportedRecord>();
    for (const record of records) {
      const key = record.values.code || record.values.tiss || record.values.tuss;
      byCode.set(key || `${record.file ?? ""}#${record.line}`, record);
    }
    return [...byCode.values()];
  }, [records]);
  const recordsPerFile = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of records) {
      const key = multi ? (record.file ?? "") : version.file.name;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [records, multi, version.file.name]);

  const errors = version.errorRows;
  const updatedAt = lastUpdateAt(version);
  const updateCount = version.files.filter((file) => file.kind === "update").length;

  return (
    <div className="space-y-6">
      <SurfaceCard padding="md">
        <SummaryList
          items={[
            { label: "Tipo da base", value: pricingBaseTypeLabel(version.baseType) },
            { label: "Data do cadastro", value: formatVersionDateTime(version.createdAt) },
            {
              label: "Status",
              value: <ImportStatusBadge status={version.importStatus} />,
            },
            ...(isCurrent
              ? [
                  {
                    label: "Situação da versão",
                    value: <span className="text-xs font-medium text-primary">Atual</span>,
                  },
                ]
              : []),
            {
              label: "Quantidade de arquivos",
              value: version.files.length.toLocaleString("pt-BR"),
            },
            {
              label: "Registros importados",
              value: version.processedCount?.toLocaleString("pt-BR") ?? "—",
            },
            ...(errors.length > 0
              ? [{ label: "Registros com erros", value: errors.length.toLocaleString("pt-BR") }]
              : []),
            { label: "Cadastrado por", value: version.createdBy },
          ]}
        />
      </SurfaceCard>

      {!browsable ? (
        <ImportCallout tone="neutral" title="Detalhes indisponíveis">
          A importação não foi concluída. Consulte o resumo da importação para ver o motivo.
        </ImportCallout>
      ) : (
        <Tabs defaultValue="files" className="space-y-4">
          <TabsList className={appTabsListClass}>
            <TabsTrigger value="files" className={appTabsTriggerClass}>
              <span className={appTabsLabelClass}>
                Arquivos ({version.files.length.toLocaleString("pt-BR")})
              </span>
            </TabsTrigger>
            <TabsTrigger value="codes" className={appTabsTriggerClass}>
              <span className={appTabsLabelClass}>
                Registros vigentes
                {recordsQuery.isSuccess && ` (${currentCodes.length.toLocaleString("pt-BR")})`}
              </span>
            </TabsTrigger>
            {errors.length > 0 && (
              <TabsTrigger value="errors" className={appTabsTriggerClass}>
                <span className={appTabsLabelClass}>
                  Erros ({errors.length.toLocaleString("pt-BR")})
                </span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="files">
            <FilesTab
              version={version}
              recordsPerFile={recordsQuery.isSuccess ? recordsPerFile : null}
            />
          </TabsContent>
          <TabsContent value="codes" className="space-y-3">
            {(updateCount > 0 || updatedAt) && (
              <p className="text-sm text-muted-foreground">
                {updateCount === 1
                  ? "1 atualização aplicada"
                  : `${updateCount.toLocaleString("pt-BR")} atualizações aplicadas`}
                {updatedAt && ` · Última atualização: ${formatVersionDateTime(updatedAt)}`}
              </p>
            )}
            {recordsQuery.isPending ? (
              <TableSkeleton rows={5} columns={5} />
            ) : recordsQuery.isError ? (
              <ErrorState
                title="Não foi possível carregar os códigos"
                description="Tente novamente em alguns instantes."
                onRetry={() => void recordsQuery.refetch()}
              />
            ) : (
              <CodesTab
                version={version}
                records={currentCodes}
                fields={(recordsQuery.data?.fields ?? []).filter((field) => field !== "ean")}
              />
            )}
          </TabsContent>
          {errors.length > 0 && (
            <TabsContent value="errors">
              <ErrorsTab rows={errors} multi={multi} />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}

function fileOrigin(version: PricingVersion, fileName: string | undefined): string {
  const file = version.files.find((item) => item.name === fileName) ?? version.file;
  return file.kind === "update" ? `Atualização · ${file.name}` : `Versão · ${file.name}`;
}

async function downloadFile(file: PricingVersionFile) {
  try {
    const href = await createPricingVersionFileUrl(file.path, file.name);
    const link = document.createElement("a");
    link.href = href;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    toast.error("Não foi possível baixar o arquivo.");
  }
}

function TabSearch({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SearchField
      id={id}
      label="Buscar"
      fieldClassName="max-w-md"
      placeholder={placeholder}
      value={value}
      clearable
      onChange={(event) => onChange(event.target.value)}
      onClear={() => onChange("")}
    />
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <DataTableRow>
      <DataTableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        Nenhum resultado encontrado.
      </DataTableCell>
    </DataTableRow>
  );
}

function FilesTab({
  version,
  recordsPerFile,
}: {
  version: PricingVersion;
  recordsPerFile: Map<string, number> | null;
}) {
  const [search, setSearch] = useState("");
  const filtered = version.files.filter((file) => normalize(file.name).includes(normalize(search)));
  const { rows, pagination, resetPage } = usePaged(filtered);

  return (
    <div className="space-y-3">
      <TabSearch
        id="import-files-search"
        placeholder="Buscar por nome do arquivo"
        value={search}
        onChange={(value) => {
          setSearch(value);
          resetPage();
        }}
      />
      <DataTable>
        <div className="overflow-x-auto">
          <DataTableRoot>
            <DataTableHeader>
              <tr>
                <DataTableHead>Arquivo</DataTableHead>
                <DataTableHead>Tipo</DataTableHead>
                <DataTableHead>Data</DataTableHead>
                <DataTableHead className="text-right">Registros</DataTableHead>
                <DataTableHead className="text-right">Ações</DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {rows.length === 0 && <EmptyRow colSpan={5} />}
              {rows.map((file) => {
                const isUpdate = file.kind === "update";
                const records = recordsPerFile?.get(file.name);
                return (
                  <DataTableRow key={file.path}>
                    <DataTableCell className="max-w-96 break-all">{file.name}</DataTableCell>
                    <DataTableCell>
                      <Badge variant={isUpdate ? "info-soft" : "neutral-soft"} size="sm">
                        {isUpdate ? "Atualização" : "Versão"}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap">
                      {formatVersionDateTime(file.addedAt ?? version.createdAt)}
                    </DataTableCell>
                    <DataTableCell className="text-right font-mono text-xs tabular-nums">
                      {records === undefined ? "—" : records.toLocaleString("pt-BR")}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Baixar ${file.name}`}
                            onClick={() => void downloadFile(file)}
                          >
                            <Download className="size-4" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Baixar arquivo</TooltipContent>
                      </Tooltip>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTableRoot>
        </div>
        {filtered.length > 0 && (
          <TablePagination id="import-files" {...pagination} className="px-4 pb-4" />
        )}
      </DataTable>
    </div>
  );
}

function CodesTab({
  version,
  records,
  fields,
}: {
  version: PricingVersion;
  records: ImportedRecord[];
  fields: ReturnType<typeof parsePricingImportSet>["fields"];
}) {
  const [search, setSearch] = useState("");
  const term = normalize(search);
  const filtered = term
    ? records.filter((record) =>
        [
          record.values.code,
          record.values.tuss,
          record.values.tiss,
          record.values.description,
          record.content,
        ]
          .filter(Boolean)
          .some((value) => normalize(value as string).includes(term)),
      )
    : records;
  const { rows, pagination, resetPage } = usePaged(filtered);
  const showRaw = fields.length === 0;
  const codeLabel = version.baseType === "simpro" ? "Código SIMPRO" : "Código";

  return (
    <div className="space-y-3">
      <TabSearch
        id="import-codes-search"
        placeholder={`Buscar por ${codeLabel.toLowerCase()}, TUSS ou descrição`}
        value={search}
        onChange={(value) => {
          setSearch(value);
          resetPage();
        }}
      />
      <DataTable>
        <div className="overflow-x-auto">
          <DataTableRoot>
            <DataTableHeader>
              <tr>
                {showRaw && <DataTableHead>Conteúdo da linha</DataTableHead>}
                {fields.map((field) => (
                  <DataTableHead
                    key={field}
                    className={field === "price" ? "text-right" : undefined}
                  >
                    {importFieldLabel(field, version.baseType)}
                  </DataTableHead>
                ))}
                <DataTableHead>Origem</DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {rows.length === 0 && <EmptyRow colSpan={Math.max(fields.length, 1) + 1} />}
              {rows.map((record) => (
                <DataTableRow key={`${record.file ?? ""}-${record.line}`}>
                  {showRaw && (
                    <DataTableCell className="max-w-96 break-all font-mono text-xs">
                      {record.content}
                    </DataTableCell>
                  )}
                  {fields.map((field) => (
                    <DataTableCell
                      key={field}
                      className={
                        field === "description" ? undefined : "font-mono text-xs tabular-nums"
                      }
                    >
                      <span className={field === "price" ? "block text-right" : undefined}>
                        {record.values[field] || "—"}
                      </span>
                    </DataTableCell>
                  ))}
                  <DataTableCell className="max-w-72 break-all text-xs text-muted-foreground">
                    {fileOrigin(version, record.file)}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </div>
        {filtered.length > 0 && (
          <TablePagination id="import-codes" {...pagination} className="px-4 pb-4" />
        )}
      </DataTable>
    </div>
  );
}

function ErrorsTab({ rows: allRows, multi }: { rows: ImportErrorRow[]; multi: boolean }) {
  const [search, setSearch] = useState("");
  const term = normalize(search);
  const filtered = term
    ? allRows.filter((row) =>
        [row.reason, row.content, row.file ?? ""].some((value) => normalize(value).includes(term)),
      )
    : allRows;
  const { rows, pagination, resetPage } = usePaged(filtered);

  return (
    <div className="space-y-3">
      <TabSearch
        id="import-errors-search"
        placeholder="Buscar por motivo ou conteúdo"
        value={search}
        onChange={(value) => {
          setSearch(value);
          resetPage();
        }}
      />
      <DataTable>
        <div className="overflow-x-auto">
          <DataTableRoot>
            <DataTableHeader>
              <tr>
                {multi && <DataTableHead>Arquivo</DataTableHead>}
                <DataTableHead>Linha</DataTableHead>
                <DataTableHead>Motivo</DataTableHead>
                <DataTableHead>Conteúdo da linha</DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {rows.length === 0 && <EmptyRow colSpan={multi ? 4 : 3} />}
              {rows.map((row) => (
                <DataTableRow key={`${row.file ?? ""}-${row.line}`}>
                  {multi && (
                    <DataTableCell className="max-w-72 break-all align-top text-xs">
                      {row.file ?? "—"}
                    </DataTableCell>
                  )}
                  <DataTableCell className="whitespace-nowrap align-top font-mono text-xs">
                    {multi ? row.line.toLocaleString("pt-BR") : lineLabel(row.line, row.file)}
                  </DataTableCell>
                  <DataTableCell className="align-top">{row.reason}</DataTableCell>
                  <DataTableCell className="max-w-72 break-all align-top font-mono text-xs text-muted-foreground">
                    {row.content}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </div>
        {filtered.length > 0 && (
          <TablePagination id="import-errors" {...pagination} className="px-4 pb-4" />
        )}
      </DataTable>
    </div>
  );
}
