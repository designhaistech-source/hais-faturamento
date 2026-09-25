import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CircleCheck,
  CircleX,
  FileWarning,
  Info,
  Paperclip,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { ErrorState, TableSkeleton } from "@/components/data-state";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { TablePagination } from "@/components/table-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  IMPORT_STATUS_LABEL,
  importFieldLabel,
  parsePricingImportSet,
  type ImportStatus,
} from "../data/pricing-import";
import { pricingBaseTypeLabel, type PricingVersion } from "../data/pricing-versions";
import { downloadPricingVersionBlob } from "../data/pricing-versions-service";

const STATUS_VISUAL: Record<ImportStatus, { tone: StatusTone; icon: LucideIcon }> = {
  COMPLETED: { tone: "success", icon: CircleCheck },
  COMPLETED_WITH_ERRORS: { tone: "warning", icon: TriangleAlert },
  NOT_SUPPORTED: { tone: "neutral", icon: Ban },
  INVALID_FORMAT: { tone: "danger", icon: FileWarning },
  FAILED: { tone: "danger", icon: CircleX },
};

/** Resultado da importação (informativo, não clicável). */
export function ImportStatusBadge({ status }: { status: ImportStatus | null }) {
  if (status === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const visual = STATUS_VISUAL[status];
  return <StatusBadge tone={visual.tone} icon={visual.icon} label={IMPORT_STATUS_LABEL[status]} />;
}

const PAGE_SIZE = 20;

const BLOCKING_TITLE: Partial<Record<ImportStatus, string>> = {
  FAILED: "A importação falhou",
  NOT_SUPPORTED: "Arquivo não suportado",
  INVALID_FORMAT: "Formato inválido",
};

interface ImportDetailsModalProps {
  version: PricingVersion | null;
  onOpenChange: (open: boolean) => void;
}

/** Mesmo modal para todos os status; só o conteúdo central muda. */
export function ImportDetailsModal({ version, onOpenChange }: ImportDetailsModalProps) {
  return (
    <AppModal
      open={version !== null}
      onOpenChange={onOpenChange}
      title="Detalhes da importação"
      description={
        version
          ? version.files.length > 1
            ? `${version.file.name} +${version.files.length - 1} ${version.files.length === 2 ? "arquivo" : "arquivos"}`
            : version.file.name
          : undefined
      }
      size="lg"
      footer={
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      }
    >
      {version && <ImportDetailsContent key={version.id} version={version} />}
    </AppModal>
  );
}

function ImportDetailsContent({ version }: { version: PricingVersion }) {
  if (version.files.length <= 1) return <ImportDetailsBody version={version} />;
  return (
    <div className="space-y-4">
      <section aria-labelledby="pricing-import-files" className="space-y-2">
        <h3 id="pricing-import-files" className="text-sm font-medium text-foreground">
          {version.files.length} arquivos nesta importação
        </h3>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {version.files.map((file) => (
            <li key={file.path} className="flex min-w-0 items-center gap-3 px-3 py-2">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 break-all text-sm text-foreground">{file.name}</span>
            </li>
          ))}
        </ul>
      </section>
      <ImportDetailsBody version={version} />
    </div>
  );
}

function lineLabel(line: number, file: string | undefined): string {
  return file ? `${file} · linha ${line}` : String(line);
}

function ImportDetailsBody({ version }: { version: PricingVersion }) {
  if (!version.detailsAvailable || version.importStatus === null) {
    return (
      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Detalhes da importação indisponíveis</AlertTitle>
        <AlertDescription>
          Esta versão foi cadastrada antes da disponibilização do detalhamento das importações.
        </AlertDescription>
      </Alert>
    );
  }
  switch (version.importStatus) {
    case "COMPLETED":
      return <ImportedRecords version={version} />;
    case "COMPLETED_WITH_ERRORS":
      return <ErrorRows version={version} />;
    case "NOT_SUPPORTED":
      // Neutro, como o badge: não é erro, apenas arquivo fora do suportado.
      return (
        <Alert variant="neutral">
          <Ban className="size-4" aria-hidden="true" />
          <AlertTitle>{BLOCKING_TITLE.NOT_SUPPORTED}</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {version.importProblem ?? "Motivo não informado."}
          </AlertDescription>
        </Alert>
      );
    default:
      return (
        <Alert variant="destructive">
          <CircleX className="size-4" aria-hidden="true" />
          <AlertTitle>{BLOCKING_TITLE[version.importStatus]}</AlertTitle>
          <AlertDescription>{version.importProblem ?? "Motivo não informado."}</AlertDescription>
        </Alert>
      );
  }
}

function usePage(total: number) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  return {
    page: current,
    setPage,
    pageSize,
    onPageSizeChange: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    start: (current - 1) * pageSize,
  };
}

function ImportedRecords({ version }: { version: PricingVersion }) {
  const query = useQuery({
    queryKey: ["pricing-version-records", version.id],
    queryFn: async () => {
      const parts = await Promise.all(
        version.files.map(async (file) => ({
          name: file.name,
          content: await (await downloadPricingVersionBlob(file.path)).text(),
        })),
      );
      return parsePricingImportSet(parts, version.baseType);
    },
    staleTime: Infinity,
  });
  const records = query.data?.records ?? [];
  const { page, setPage, start, pageSize, onPageSizeChange } = usePage(records.length);

  if (query.isPending) return <TableSkeleton rows={5} columns={5} />;
  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar os registros"
        description="Tente novamente em alguns instantes."
        onRetry={() => void query.refetch()}
      />
    );
  }

  // EAN é usado só na validação; a listagem segue as colunas definidas para a base.
  const fields = (query.data?.fields ?? []).filter((field) => field !== "ean");
  // Sem colunas reconhecidas no cabeçalho, a linha é exibida como veio no arquivo.
  const showRaw = fields.length === 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {records.length === 1
          ? "1 registro importado."
          : `${records.length.toLocaleString("pt-BR")} registros importados.`}
      </p>
      <DataTable>
        <div className="overflow-x-auto">
          <DataTableRoot>
            <DataTableHeader>
              <tr>
                <DataTableHead>Linha</DataTableHead>
                {showRaw && <DataTableHead>Conteúdo da linha</DataTableHead>}
                {fields.map((field) => (
                  <DataTableHead
                    key={field}
                    className={field === "price" ? "text-right" : undefined}
                  >
                    {importFieldLabel(field, version.baseType)}
                  </DataTableHead>
                ))}
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {records.slice(start, start + pageSize).map((record) => (
                <DataTableRow key={`${record.file ?? ""}-${record.line}`}>
                  <DataTableCell className="whitespace-nowrap font-mono text-xs">
                    {lineLabel(record.line, record.file)}
                  </DataTableCell>
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
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </div>
        {records.length > 10 && (
          <TablePagination
            id="pricing-import-records"
            totalItems={records.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={onPageSizeChange}
            className="px-4 pb-4"
          />
        )}
      </DataTable>
    </div>
  );
}

function ErrorRows({ version }: { version: PricingVersion }) {
  const rows = version.errorRows;
  const errors = version.errorCount ?? rows.length;
  const total = errors + (version.processedCount ?? 0);
  const { page, setPage, start, pageSize, onPageSizeChange } = usePage(rows.length);
  const lineWord = total === 1 ? "linha" : "linhas";

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertDescription>
          {errors} de {total} {lineWord} com erro. Por isso esta versão não substitui a versão atual
          de {pricingBaseTypeLabel(version.baseType)}.
        </AlertDescription>
      </Alert>
      <DataTable>
        <div className="overflow-x-auto">
          <DataTableRoot>
            <DataTableHeader>
              <tr>
                <DataTableHead>Linha</DataTableHead>
                <DataTableHead>Motivo</DataTableHead>
                <DataTableHead>Conteúdo da linha</DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {rows.slice(start, start + pageSize).map((row) => (
                <DataTableRow key={`${row.file ?? ""}-${row.line}`}>
                  <DataTableCell className="whitespace-nowrap font-mono text-xs align-top">
                    {lineLabel(row.line, row.file)}
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
        {rows.length > 10 && (
          <TablePagination
            id="pricing-import-errors"
            totalItems={rows.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={onPageSizeChange}
            className="px-4 pb-4"
          />
        )}
      </DataTable>
    </div>
  );
}
