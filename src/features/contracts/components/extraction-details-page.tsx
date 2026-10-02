import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileSearch } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { EmptyState, ErrorState, LoadingState, TableSkeleton } from "@/components/data-state";
import {
  DataTable,
  DataTableBody,
  DataTableCard,
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
import { FilterCard } from "@/components/filter-card";
import { SearchField, SelectField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { SurfaceCard } from "@/components/surface-card";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

import type { Contract } from "../data/contracts";
import { contractsQueryKey, listContracts } from "../data/contracts-service";
import {
  amendmentAsContractFile,
  contractAmendmentsQueryKey,
  listContractAmendments,
} from "../data/contract-amendments-service";
import {
  CONTRACT_RULE_KINDS,
  contractRuleEffect,
  contractRuleKindLabel,
  contractRuleKindOf,
  contractRuleReference,
  contractRuleValidity,
  extractionDateOf,
  type ContractRuleKind,
} from "../data/contract-rule-details";
import { contractRuleTitle, type ContractRulesDisplayStatus } from "../data/contract-rules";
import {
  contractRulesQueryKey,
  contractRulesStatusQueryKey,
  listContractRules,
  listContractRulesStatuses,
} from "../data/contract-rules-service";
import { useContractExtractionStates } from "../data/contract-extraction";
import { AmendmentStatusBadge } from "./amendment-status-badge";
import { ContractRulesStatusBadge } from "./contract-rules-status-badge";

const COLUMNS = ["Regra", "Referência", "Efeito", "Vigência"];

const KIND_OPTIONS = [
  { value: "all", label: "Todos os tipos" },
  ...CONTRACT_RULE_KINDS.map((kind) => ({ value: kind, label: contractRuleKindLabel(kind) })),
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export interface ExtractionOperatorContext {
  id: string;
  name: string;
}

/** Detalhamento das regras extraídas de um arquivo (contrato original ou aditivo). */
export function ExtractionDetailsPage({
  contractId,
  fileId,
  operator,
}: {
  contractId: string;
  fileId: string;
  operator: ExtractionOperatorContext;
}) {
  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });
  const amendmentsQuery = useQuery({
    queryKey: contractAmendmentsQueryKey(contractId),
    queryFn: () => listContractAmendments(contractId),
  });
  const contract = contractsQuery.data?.find((item) => item.id === contractId) ?? null;
  const amendment = amendmentsQuery.data?.find((item) => item.id === fileId) ?? null;
  const isOriginal = fileId === contractId;
  const fileName = isOriginal ? contract?.file.name : amendment?.file.name;
  const pending = contractsQuery.isPending || (!isOriginal && amendmentsQuery.isPending);
  const failed = contractsQuery.isError || (!isOriginal && amendmentsQuery.isError);
  const missing = !pending && !failed && (!contract || (!isOriginal && !amendment));

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="contratos" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb parent={{ label: operator.name, contractId: operator.id }} />
            <PageHeader
              title="Detalhes da extração"
              description={fileName}
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
                <LoadingState title="Carregando extração" />
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
            ) : missing || !contract ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Arquivo não encontrado"
                  description="Ele pode ter sido removido. Volte para a página da operadora."
                />
              </SurfaceCard>
            ) : (
              <ExtractionContent
                contract={contract}
                amendmentId={isOriginal ? null : fileId}
                previewFile={
                  amendment ? amendmentAsContractFile(amendment, contract.company) : contract
                }
                amendmentStatus={amendment?.extractionStatus ?? null}
              />
            )}
          </main>
          <SiteFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}

function ExtractionContent({
  contract,
  amendmentId,
  previewFile,
  amendmentStatus,
}: {
  contract: Contract;
  amendmentId: string | null;
  previewFile: Contract;
  amendmentStatus: ContractRulesDisplayStatus | null;
}) {
  const rulesStatusQuery = useQuery({
    queryKey: contractRulesStatusQueryKey,
    queryFn: listContractRulesStatuses,
    enabled: amendmentId === null,
  });
  const extractionStates = useContractExtractionStates();
  const originalStatus: ContractRulesDisplayStatus | null =
    (extractionStates[contract.id] as ContractRulesDisplayStatus | undefined) ??
    (rulesStatusQuery.data ? (rulesStatusQuery.data[contract.id] ?? "not_extracted") : null);
  const status = amendmentId === null ? originalStatus : amendmentStatus;
  const available = status === "available";

  const rulesQuery = useQuery({
    queryKey: contractRulesQueryKey(contract.id, amendmentId),
    queryFn: () => listContractRules(contract.id, amendmentId),
    enabled: available,
  });
  const rules = useMemo(() => rulesQuery.data ?? [], [rulesQuery.data]);
  const extractedAt = extractionDateOf(rules);

  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<ContractRuleKind | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const activeCount = [search.trim() !== "", kind !== "all"].filter(Boolean).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rules.filter((rule) => {
      if (kind !== "all" && contractRuleKindOf(rule) !== kind) return false;
      if (!term) return true;
      return [contractRuleTitle(rule), contractRuleReference(rule), contractRuleEffect(rule)]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [rules, search, kind]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function clearFilters() {
    setSearch("");
    setKind("all");
    setPage(1);
  }

  const statusBadge =
    amendmentId === null || !amendmentStatus ? (
      <ContractRulesStatusBadge status={status} />
    ) : (
      <AmendmentStatusBadge
        status={amendmentStatus as Parameters<typeof AmendmentStatusBadge>[0]["status"]}
      />
    );

  const summary = [
    { label: "Tipo do arquivo", value: amendmentId ? "Aditivo" : "Contrato original" },
    {
      label: "Data da extração",
      value:
        available && rulesQuery.isPending
          ? "Carregando..."
          : extractedAt
            ? formatDateTime(extractedAt)
            : "—",
    },
    { label: "Status", value: statusBadge },
    {
      label: "Regras identificadas",
      value: !available
        ? "—"
        : rulesQuery.isPending
          ? "Carregando..."
          : rulesQuery.data
            ? rules.length.toLocaleString("pt-BR")
            : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <SurfaceCard padding="md">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label} className="min-w-0 space-y-0.5">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="min-w-0 break-words text-sm text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>

      <section aria-labelledby="extracted-rules-title" className="space-y-4">
        <h2 id="extracted-rules-title" className="text-lg font-semibold text-foreground">
          Regras identificadas
        </h2>

        {!available ? (
          <SurfaceCard padding="md">
            <EmptyState
              icon={<FileSearch className="size-5" aria-hidden="true" />}
              title="Regras indisponíveis"
              description="As regras aparecem aqui quando a extração deste arquivo estiver concluída."
            />
          </SurfaceCard>
        ) : rulesQuery.isPending ? (
          <SurfaceCard padding="none">
            <TableSkeleton rows={5} columns={6} />
          </SurfaceCard>
        ) : rulesQuery.isError ? (
          <SurfaceCard padding="md">
            <ErrorState
              title="Não foi possível carregar as regras"
              onRetry={() => void rulesQuery.refetch()}
            />
          </SurfaceCard>
        ) : rules.length === 0 ? (
          <SurfaceCard padding="md">
            <EmptyState
              icon={<FileSearch className="size-5" aria-hidden="true" />}
              title="Nenhuma regra disponível"
              description="Não há regras guardadas para este arquivo."
            />
          </SurfaceCard>
        ) : (
          <>
            <FilterCard
              id="extracted-rules-filters"
              variant="bar"
              activeCount={activeCount}
              onClear={clearFilters}
              clearDisabled={activeCount === 0}
              barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:gap-4"
            >
              <SearchField
                id="extracted-rules-search"
                label="Buscar"
                fieldClassName="sm:col-span-2 lg:col-span-1"
                placeholder="Buscar por regra, referência ou efeito"
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
                id="extracted-rules-kind"
                label="Tipo da regra"
                value={kind}
                options={KIND_OPTIONS}
                onValueChange={(value) => {
                  setKind(value as ContractRuleKind | "all");
                  setPage(1);
                }}
              />
            </FilterCard>

            {filtered.length === 0 ? (
              <EmptyStateCard
                icon={<FileSearch className="size-10" aria-hidden="true" />}
                title="Nenhuma regra encontrada"
                description="Ajuste a busca ou os filtros para ver outros resultados."
                action={
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                }
              />
            ) : (
              <DataTable>
                <DataTableDesktop>
                  <DataTableRoot>
                    <DataTableHeader>
                      <tr>
                        {COLUMNS.map((column) => (
                          <DataTableHead key={column}>{column}</DataTableHead>
                        ))}
                      </tr>
                    </DataTableHeader>
                    <DataTableBody>
                      {paginated.map((rule) => (
                        <DataTableRow key={rule.id}>
                          <DataTableCell className="font-medium">
                            {contractRuleTitle(rule)}
                          </DataTableCell>
                          <DataTableCell>{contractRuleReference(rule)}</DataTableCell>
                          <DataTableCell>{contractRuleEffect(rule)}</DataTableCell>
                          <DataTableCell className="whitespace-nowrap">
                            {contractRuleValidity(rule)}
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTableRoot>
                </DataTableDesktop>

                <DataTableCardList divided>
                  {paginated.map((rule) => (
                    <DataTableCard key={rule.id} flat className="space-y-1.5 py-2.5">
                      <DataTableCardHeader title={contractRuleTitle(rule)} />
                      <DataTableCardFields
                        className="gap-x-4 gap-y-1"
                        fields={[
                          { label: "Referência", value: contractRuleReference(rule) },
                          { label: "Efeito", value: contractRuleEffect(rule) },
                          { label: "Vigência", value: contractRuleValidity(rule) },
                        ]}
                      />
                    </DataTableCard>
                  ))}
                </DataTableCardList>

                <TablePagination
                  id="extracted-rules"
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
          </>
        )}
      </section>
    </div>
  );
}
