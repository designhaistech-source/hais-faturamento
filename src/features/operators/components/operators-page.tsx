import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronRight, CircleCheck, CircleDashed, Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SurfaceCard } from "@/components/surface-card";
import { ErrorState, TableSkeleton } from "@/components/data-state";
import { SearchField, SelectField } from "@/components/form-field";
import { FilterCard } from "@/components/filter-card";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "registered", label: "Contrato cadastrado" },
  { value: "missing", label: "Não cadastrado" },
];
import { StatusBadge } from "@/components/status-badge";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";
import {
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCardFields,
  DataTableCardHeader,
  DataTableCardList,
  DataTableDesktop,
  DataTableCell,
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import { formatIsoToBr } from "@/lib/date";
import {
  contractAmendmentsQueryKey,
  contractsQueryKey,
  listContractAmendments,
  listContracts,
} from "@/features/contracts";
import { Button } from "@/components/ui/button";
import { AddContractModal } from "./add-document-modal";
import {
  listOperators,
  operatorsQueryKey,
  resolveOperatorContractId,
  type Operator,
} from "../data/operators";

function amendmentsLabel(count: number | null): string {
  if (count === null) return "—";
  return `${count} ${count === 1 ? "aditivo" : "aditivos"}`;
}

function ContractBadge({ operator }: { operator: Operator }) {
  return operator.hasContract ? (
    <StatusBadge tone="success" icon={CircleCheck} label="Contrato cadastrado" />
  ) : (
    <StatusBadge tone="neutral" icon={CircleDashed} label="Não cadastrado" />
  );
}

export function OperatorsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const activeCount =
    (search.trim() ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (validFrom || validTo ? 1 : 0);
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setValidFrom("");
    setValidTo("");
    setPage(1);
  };
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const query = useQuery({ queryKey: operatorsQueryKey, queryFn: listOperators });

  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });

  const [addOpen, setAddOpen] = useState(false);

  // Vincula cada operadora ao contrato real, quando existe, antes de exibir ou cadastrar.
  const merged = useMemo(() => {
    const contracts = contractsQuery.data ?? [];
    return (query.data ?? []).map((operator) => {
      const id = resolveOperatorContractId(operator, contracts);
      const contract = id ? contracts.find((item) => item.id === id) : undefined;
      if (!contract) return { ...operator, contractId: null };
      return {
        ...operator,
        hasContract: true,
        contractId: contract.id,
        validUntil: operator.validUntil || contract.validUntil,
      };
    });
  }, [query.data, contractsQuery.data]);

  const amendmentQueries = useQueries({
    queries: merged.map((operator) => ({
      queryKey: contractAmendmentsQueryKey(operator.contractId ?? ""),
      queryFn: () => listContractAmendments(operator.contractId ?? ""),
      enabled: !!operator.contractId,
    })),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const list = merged.map((operator, index) => {
      const amendments = amendmentQueries[index]?.data;
      if (!operator.contractId) return operator;
      return { ...operator, amendmentsCount: amendments?.length ?? operator.amendmentsCount ?? 0 };
    });
    return list.filter((o) => {
      if (term && !o.name.toLocaleLowerCase("pt-BR").includes(term)) return false;
      if (statusFilter === "registered" && !o.hasContract) return false;
      if (statusFilter === "missing" && o.hasContract) return false;
      if (validFrom || validTo) {
        if (!o.validUntil) return false;
        if (validFrom && o.validUntil < validFrom) return false;
        if (validTo && o.validUntil > validTo) return false;
      }
      return true;
    });
  }, [merged, amendmentQueries, search, statusFilter, validFrom, validTo]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const navigate = useNavigate();
  const openOperator = (operator: Operator) =>
    void navigate({ to: "/contratos/$contractId", params: { contractId: operator.id } });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="contratos" />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <AppBreadcrumb />
          <PageHeader
            title="Contratos com operadoras"
            description="Gerencie os contratos do hospital com cada operadora."
            actions={
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={query.isPending || contractsQuery.isPending}
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-4" aria-hidden="true" />
                Cadastrar contrato
              </Button>
            }
          />
          <AddContractModal open={addOpen} onOpenChange={setAddOpen} operators={merged} />

          <FilterCard
            id="operators-filters"
            variant="bar"
            activeCount={activeCount}
            onClear={clearFilters}
            clearDisabled={activeCount === 0}
            barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_14rem_22rem_auto] lg:gap-4"
          >
            <SearchField
              id="operators-search"
              label="Buscar"
              fieldClassName="sm:col-span-2 lg:col-span-1"
              placeholder="Buscar por operadora"
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
              id="operators-contract-status"
              label="Status do contrato"
              className="sm:col-span-2 lg:col-span-1"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            />
            <fieldset className="min-w-0 space-y-1.5 sm:col-span-2 sm:space-y-2 lg:col-span-1">
              <legend className="text-xs font-medium leading-snug text-muted-foreground">
                Validade do contrato
              </legend>
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-nowrap">
                <span className="shrink-0 text-xs text-muted-foreground">De</span>
                <Input
                  id="operators-valid-from"
                  type="date"
                  aria-label="Validade do contrato de"
                  className="min-w-0 flex-1"
                  value={validFrom}
                  max={validTo || undefined}
                  onChange={(event) => {
                    setValidFrom(event.target.value);
                    setPage(1);
                  }}
                />
                <span className="shrink-0 text-xs text-muted-foreground">até</span>
                <Input
                  id="operators-valid-to"
                  type="date"
                  aria-label="Validade do contrato até"
                  className="min-w-0 flex-1"
                  value={validTo}
                  min={validFrom || undefined}
                  onChange={(event) => {
                    setValidTo(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </fieldset>
          </FilterCard>

          <section className="space-y-4" aria-label="Lista de operadoras">
            {query.isPending ? (
              <SurfaceCard padding="none">
                <TableSkeleton rows={5} columns={4} />
              </SurfaceCard>
            ) : query.isError ? (
              <SurfaceCard padding="md">
                <ErrorState
                  title="Não foi possível carregar as operadoras"
                  description="Tente novamente em alguns instantes."
                  onRetry={() => void query.refetch()}
                />
              </SurfaceCard>
            ) : (
              <div className="min-w-0 space-y-4">
                <DataTableCardList breakpoint="md">
                  {visible.length === 0 ? (
                    <li className="py-6 text-center text-sm text-muted-foreground">
                      Nenhuma operadora encontrada.
                    </li>
                  ) : (
                    visible.map((operator) => (
                      <DataTableCard
                        key={operator.id}
                        className="cursor-pointer"
                        onClick={() => openOperator(operator)}
                      >
                        <button
                          type="button"
                          /* ds-allow: linha clicável em cartão */ className="w-full space-y-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Acessar ${operator.name}`}
                        >
                          <DataTableCardHeader
                            title={operator.name}
                            trailing={
                              <ChevronRight
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                              />
                            }
                          />
                          <DataTableCardFields
                            fields={[
                              {
                                label: "Status do contrato",
                                value: <ContractBadge operator={operator} />,
                              },
                              {
                                label: "Validade",
                                value: operator.validUntil
                                  ? formatIsoToBr(operator.validUntil)
                                  : "—",
                              },
                              {
                                label: "Aditivos",
                                value: amendmentsLabel(operator.amendmentsCount),
                              },
                            ]}
                          />
                        </button>
                      </DataTableCard>
                    ))
                  )}
                </DataTableCardList>
                <DataTableDesktop breakpoint="md">
                  <DataTable>
                    <DataTableRoot>
                      <DataTableHeader>
                        <tr>
                          <DataTableHead>Operadora</DataTableHead>
                          <DataTableHead>Status do contrato</DataTableHead>
                          <DataTableHead>Validade</DataTableHead>
                          <DataTableHead>Aditivos</DataTableHead>
                          <DataTableHead className="w-12">
                            <span className="sr-only">Acessar</span>
                          </DataTableHead>
                        </tr>
                      </DataTableHeader>
                      <DataTableBody>
                        {visible.length === 0 ? (
                          <DataTableEmptyRow colSpan={5}>
                            Nenhuma operadora encontrada.
                          </DataTableEmptyRow>
                        ) : (
                          visible.map((operator) => (
                            <DataTableRow
                              key={operator.id}
                              tabIndex={0}
                              role="link"
                              aria-label={`Acessar ${operator.name}`}
                              onClick={() => openOperator(operator)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openOperator(operator);
                                }
                              }}
                              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                            >
                              <DataTableCell className="font-medium">{operator.name}</DataTableCell>
                              <DataTableCell>
                                <ContractBadge operator={operator} />
                              </DataTableCell>
                              <DataTableCell className="font-mono whitespace-nowrap">
                                {operator.validUntil ? formatIsoToBr(operator.validUntil) : "—"}
                              </DataTableCell>
                              <DataTableCell className="whitespace-nowrap">
                                {amendmentsLabel(operator.amendmentsCount)}
                              </DataTableCell>
                              <DataTableCell className="text-muted-foreground">
                                <ChevronRight className="size-4" aria-hidden="true" />
                              </DataTableCell>
                            </DataTableRow>
                          ))
                        )}
                      </DataTableBody>
                    </DataTableRoot>
                  </DataTable>
                </DataTableDesktop>
                <TablePagination
                  id="operators-pagination"
                  totalItems={filtered.length}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
