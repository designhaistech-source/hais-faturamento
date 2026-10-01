import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleCheck, Clock, FileSearch, History } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppModal } from "@/components/app-modal";
import { AppSidebar } from "@/components/app-sidebar";
import { ErrorState, LoadingState } from "@/components/data-state";
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
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { StatusBadge } from "@/components/status-badge";
import { SurfaceCard } from "@/components/surface-card";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatIsoToBr } from "@/lib/date";

import { contractsQueryKey, listContracts } from "../data/contracts-service";
import {
  contractAmendmentsQueryKey,
  listContractAmendments,
} from "../data/contract-amendments-service";
import type { ContractRulesDisplayStatus } from "../data/contract-rules";
import {
  contractRulesStatusQueryKey,
  listContractRulesStatuses,
} from "../data/contract-rules-service";
import {
  sampleExtractedRules,
  type ExtractedRule,
  type ExtractedRuleStatus,
} from "../data/file-extracted-rules";
import { ContractRulesStatusBadge } from "./contract-rules-status-badge";

const COLUMNS = ["Tipo", "Alvo", "Condição", "Efeito", "Vigência", "Status", "Ações"];

const RULE_STATUS = {
  active: { tone: "success", icon: CircleCheck, label: "Vigente" },
  pending_review: { tone: "warning", icon: Clock, label: "Em revisão" },
  expired: { tone: "neutral", icon: History, label: "Encerrada" },
} as const;

function RuleStatusBadge({ status }: { status: ExtractedRuleStatus }) {
  const { tone, icon, label } = RULE_STATUS[status];
  return <StatusBadge tone={tone} icon={icon} label={label} />;
}

function validity(rule: ExtractedRule): string {
  const from = formatIsoToBr(rule.validFrom);
  return rule.validTo ? `${from} a ${formatIsoToBr(rule.validTo)}` : `A partir de ${from}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

interface FileInfo {
  name: string;
  kind: "Contrato original" | "Aditivo";
  createdBy: string;
  createdAt: string;
  status: ContractRulesDisplayStatus | null;
}

/** Dados extraídos de um arquivo da relação contratual de uma operadora. */
export function FileExtractedDataPage({
  operator,
  contractId,
  fileId,
}: {
  operator: { id: string; name: string };
  contractId: string;
  fileId: string;
}) {
  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });
  const amendmentsQuery = useQuery({
    queryKey: contractAmendmentsQueryKey(contractId),
    queryFn: () => listContractAmendments(contractId),
  });
  const statusQuery = useQuery({
    queryKey: contractRulesStatusQueryKey,
    queryFn: listContractRulesStatuses,
  });

  const file = useMemo<FileInfo | null>(() => {
    const contract = contractsQuery.data?.find((item) => item.id === contractId);
    if (contract && fileId === contract.id) {
      return {
        name: contract.file.name,
        kind: "Contrato original",
        createdBy: "—",
        createdAt: contract.createdAt ?? "",
        status: statusQuery.data ? (statusQuery.data[contract.id] ?? "not_extracted") : null,
      };
    }
    const amendment = amendmentsQuery.data?.find((item) => item.id === fileId);
    return amendment
      ? {
          name: amendment.file.name,
          kind: "Aditivo",
          createdBy: amendment.createdBy,
          createdAt: amendment.createdAt,
          status: amendment.extractionStatus,
        }
      : null;
  }, [contractsQuery.data, amendmentsQuery.data, statusQuery.data, contractId, fileId]);

  const pending = contractsQuery.isPending || amendmentsQuery.isPending;
  const failed = contractsQuery.isError || amendmentsQuery.isError;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="contratos" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb currentLabel="Dados extraídos" operatorCrumb={operator} />
            <PageHeader
              title="Dados extraídos"
              description={file?.name}
              actions={
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/contratos/$contractId" params={{ contractId: operator.id }}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Voltar para {operator.name}
                  </Link>
                </Button>
              }
            />
            {pending ? (
              <SurfaceCard padding="md">
                <LoadingState title="Carregando dados extraídos" />
              </SurfaceCard>
            ) : failed ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Não foi possível carregar o arquivo"
                  description="Tente novamente em alguns instantes."
                  onRetry={() => {
                    void contractsQuery.refetch();
                    void amendmentsQuery.refetch();
                  }}
                />
              </SurfaceCard>
            ) : !file ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Arquivo não encontrado"
                  description={`Ele pode ter sido removido. Volte para ${operator.name}.`}
                />
              </SurfaceCard>
            ) : (
              <FileExtractedDataContent fileId={fileId} file={file} />
            )}
          </main>
          <SiteFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}

function FileExtractedDataContent({ fileId, file }: { fileId: string; file: FileInfo }) {
  const rules = useMemo(
    () => (file.status === "available" ? sampleExtractedRules(fileId) : []),
    [file.status, fileId],
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<ExtractedRule | null>(null);

  const totalPages = Math.max(1, Math.ceil(rules.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = rules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const summary = [
    { label: "Tipo do arquivo", value: file.kind },
    { label: "Status da extração", value: <ContractRulesStatusBadge status={file.status} /> },
    { label: "Data do cadastro", value: file.createdAt ? formatDateTime(file.createdAt) : "—" },
    { label: "Cadastrado por", value: file.createdBy },
    {
      label: "Regras identificadas",
      value: file.status === "available" ? rules.length.toLocaleString("pt-BR") : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <SurfaceCard padding="md">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
          {summary.map((item) => (
            <div key={item.label} className="min-w-0 space-y-0.5">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="min-w-0 break-words text-sm text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>

      <section className="space-y-4" aria-labelledby="extracted-rules-title">
        <h2
          id="extracted-rules-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          Regras extraídas ({rules.length.toLocaleString("pt-BR")})
        </h2>

        {rules.length === 0 ? (
          <EmptyStateCard
            icon={<FileSearch className="size-10" aria-hidden="true" />}
            title="Nenhuma regra disponível"
            description="As regras aparecem aqui quando a extração do arquivo estiver Concluída."
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
                  {paginated.map((rule) => (
                    <DataTableRow key={rule.id}>
                      <DataTableCell className="font-medium text-foreground">
                        {rule.type}
                      </DataTableCell>
                      <DataTableCell>{rule.target}</DataTableCell>
                      <DataTableCell>{rule.condition}</DataTableCell>
                      <DataTableCell>{rule.effect}</DataTableCell>
                      <DataTableCell className="whitespace-nowrap">{validity(rule)}</DataTableCell>
                      <DataTableCell>
                        <RuleStatusBadge status={rule.status} />
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <RuleDetailsButton rule={rule} onOpen={setSelected} />
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTableRoot>
            </DataTableDesktop>

            <DataTableCardList divided>
              {paginated.map((rule) => (
                <DataTableCard key={rule.id} flat className="space-y-1.5 py-2.5">
                  <DataTableCardHeader
                    title={rule.type}
                    trailing={<RuleStatusBadge status={rule.status} />}
                  />
                  <DataTableCardFields
                    className="gap-x-4 gap-y-1"
                    fields={[
                      { label: "Alvo", value: rule.target },
                      { label: "Condição", value: rule.condition },
                      { label: "Efeito", value: rule.effect },
                      { label: "Vigência", value: validity(rule) },
                    ]}
                  />
                  <DataTableCardActions className="-mt-0.5 justify-end">
                    <RuleDetailsButton rule={rule} onOpen={setSelected} />
                  </DataTableCardActions>
                </DataTableCard>
              ))}
            </DataTableCardList>

            <TablePagination
              id="extracted-rules"
              totalItems={rules.length}
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

      <AppModal
        open={selected !== null}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
        title="Detalhes da regra"
        description={selected?.type}
        footer={
          <Button type="button" variant="outline" size="sm" onClick={() => setSelected(null)}>
            Fechar
          </Button>
        }
      >
        {selected && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              { label: "Tipo", value: selected.type },
              { label: "Status", value: <RuleStatusBadge status={selected.status} /> },
              { label: "Alvo", value: selected.target },
              { label: "Vigência", value: validity(selected) },
              { label: "Condição", value: selected.condition },
              { label: "Efeito", value: selected.effect },
            ].map((item) => (
              <div key={item.label} className="min-w-0 space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                <dd className="min-w-0 break-words text-sm text-foreground">{item.value}</dd>
              </div>
            ))}
            <div className="min-w-0 space-y-0.5 sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Trecho do documento</dt>
              <dd className="rounded-md bg-muted p-3 text-sm text-foreground">
                “{selected.sourceExcerpt}”
              </dd>
            </div>
          </dl>
        )}
      </AppModal>
    </div>
  );
}

function RuleDetailsButton({
  rule,
  onOpen,
}: {
  rule: ExtractedRule;
  onOpen: (rule: ExtractedRule) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Ver detalhes da regra ${rule.type} — ${rule.target}`}
          onClick={() => onOpen(rule)}
        >
          <FileSearch className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Ver detalhes da regra</TooltipContent>
    </Tooltip>
  );
}
