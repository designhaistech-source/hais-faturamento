import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, CircleCheck, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { SurfaceCard } from "@/components/surface-card";
import { ErrorState, TableSkeleton } from "@/components/data-state";
import { SearchField } from "@/components/form-field";
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
import { contractsQueryKey, listContracts } from "@/features/contracts";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const query = useQuery({ queryKey: operatorsQueryKey, queryFn: listOperators });

  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const contracts = contractsQuery.data ?? [];
    // Operadoras sem contrato de exemplo passam a "cadastrado" quando o contrato é registrado.
    const list = (query.data ?? []).map((operator) => {
      if (operator.hasContract) return operator;
      const id = resolveOperatorContractId(operator, contracts);
      const contract = id ? contracts.find((item) => item.id === id) : undefined;
      return contract
        ? {
            ...operator,
            hasContract: true,
            contractId: contract.id,
            validUntil: contract.validUntil,
            amendmentsCount: 0,
          }
        : operator;
    });
    return term ? list.filter((o) => o.name.toLocaleLowerCase("pt-BR").includes(term)) : list;
  }, [query.data, contractsQuery.data, search]);
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
            title="Operadoras e contratos"
            description="Gerencie os contratos do hospital com cada operadora."
          />

          <SurfaceCard padding="md">
            <SearchField
              id="operators-search"
              label="Buscar"
              fieldClassName="max-w-md"
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
          </SurfaceCard>

          <section className="space-y-4" aria-labelledby="operators-title">
            <h2 id="operators-title" className="font-display text-lg font-semibold text-foreground">
              Operadoras
            </h2>
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
              <SurfaceCard padding="md" className="min-w-0 space-y-4">
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
                              { label: "Contrato", value: <ContractBadge operator={operator} /> },
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
                          <DataTableHead>Contrato</DataTableHead>
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
              </SurfaceCard>
            )}
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
