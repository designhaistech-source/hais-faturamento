import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Eye, FileSearch } from "lucide-react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/data-state";
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
import { SurfaceCard } from "@/components/surface-card";
import { DEFAULT_PAGE_SIZE, TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  contractRuleEffect,
  contractRuleReference,
  contractRuleValidity,
} from "../data/contract-rule-details";
import { contractRuleTitle, type ContractRule } from "../data/contract-rules";
import { contractRulesQueryKey, listContractRules } from "../data/contract-rules-service";

const COLUMNS = ["Regra", "Referência", "Efeito", "Vigência", "Origem"];

export interface RuleSourceFile {
  /** Id do contrato original ou do aditivo. */
  id: string;
  name: string;
  /** null para o contrato original. */
  amendmentId: string | null;
  /** Abre o visualizador de documento já usado na aba Arquivos. */
  onView?: () => void;
}

interface SourcedRule {
  rule: ContractRule;
  source: RuleSourceFile;
}

/** Regras identificadas em cada arquivo do contrato, sem consolidação entre eles. */
export function ContractRulesByFileTab({
  contractId,
  files,
}: {
  contractId: string;
  files: RuleSourceFile[];
}) {
  const queries = useQueries({
    queries: files.map((file) => ({
      queryKey: contractRulesQueryKey(contractId, file.amendmentId),
      queryFn: () => listContractRules(contractId, file.amendmentId),
    })),
  });

  const pending = queries.some((query) => query.isPending);
  const failed = queries.some((query) => query.isError);
  // Um mesmo documento pode ter sido enviado mais de uma vez; a regra aparece só na primeira origem.
  const seen = new Set<string>();
  const rows: SourcedRule[] = files.flatMap((source, index) =>
    (queries[index]?.data ?? [])
      .filter((rule) => {
        const signature = ruleSignature(rule);
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      })
      .map((rule) => ({ rule, source })),
  );

  const [search, setSearch] = useState("");
  const [sourceId, setSourceId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const activeCount = [search.trim() !== "", sourceId !== "all"].filter(Boolean).length;

  const sourceOptions = [
    { value: "all", label: "Todos os arquivos" },
    // O mesmo nome pode estar registrado mais de uma vez; cada arquivo aparece uma única vez.
    ...Array.from(new Set(files.map((file) => file.name))).map((name) => ({
      value: name,
      label: name,
    })),
  ];

  const term = search.trim().toLowerCase();
  const filtered = rows.filter(({ rule, source }) => {
    if (sourceId !== "all" && source.name !== sourceId) return false;
    if (!term) return true;
    return [contractRuleTitle(rule), contractRuleReference(rule), contractRuleEffect(rule)]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function clearFilters() {
    setSearch("");
    setSourceId("all");
    setPage(1);
  }

  if (pending) {
    return (
      <SurfaceCard padding="none">
        <TableSkeleton rows={5} columns={5} />
      </SurfaceCard>
    );
  }
  if (failed) {
    return (
      <SurfaceCard padding="md">
        <ErrorState
          title="Não foi possível carregar as regras"
          onRetry={() => queries.forEach((query) => void query.refetch())}
        />
      </SurfaceCard>
    );
  }
  if (rows.length === 0) {
    return (
      <SurfaceCard padding="md">
        <EmptyState
          icon={<FileSearch className="size-5" aria-hidden="true" />}
          title="Nenhuma regra identificada"
          description="As regras aparecem aqui quando a extração dos arquivos do contrato for concluída."
        />
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      <FilterCard
        id="contract-rules-filters"
        variant="bar"
        activeCount={activeCount}
        onClear={clearFilters}
        clearDisabled={activeCount === 0}
        barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)_auto] lg:gap-4"
      >
        <SearchField
          id="contract-rules-search"
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
          id="contract-rules-source"
          label="Arquivo de origem"
          value={sourceId}
          options={sourceOptions}
          onValueChange={(value) => {
            setSourceId(value);
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
                  <DataTableHead className="w-px">
                    <span className="sr-only">Ações</span>
                  </DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {paginated.map(({ rule, source }) => (
                  <DataTableRow key={`${source.id}-${rule.id}`}>
                    <DataTableCell className="min-w-48 max-w-72 font-medium">
                      <span className="line-clamp-2">{contractRuleTitle(rule)}</span>
                    </DataTableCell>
                    <DataTableCell>{contractRuleReference(rule)}</DataTableCell>
                    <DataTableCell>{contractRuleEffect(rule)}</DataTableCell>
                    <DataTableCell className="whitespace-nowrap">
                      {contractRuleValidity(rule)}
                    </DataTableCell>
                    <DataTableCell className="max-w-56">
                      <SourceName name={source.name} />
                    </DataTableCell>
                    <DataTableCell className="w-px whitespace-nowrap text-right">
                      <ViewSourceButton source={source} />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTableRoot>
          </DataTableDesktop>

          <DataTableCardList divided>
            {paginated.map(({ rule, source }) => (
              <DataTableCard key={`${source.id}-${rule.id}`} flat className="space-y-1.5 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <DataTableCardHeader title={contractRuleTitle(rule)} />
                  <ViewSourceButton source={source} />
                </div>
                <DataTableCardFields
                  className="gap-x-4 gap-y-1"
                  fields={[
                    { label: "Referência", value: contractRuleReference(rule) },
                    { label: "Efeito", value: contractRuleEffect(rule) },
                    { label: "Vigência", value: contractRuleValidity(rule) },
                    {
                      label: "Origem",
                      value: <span className="break-all">{source.name}</span>,
                    },
                  ]}
                />
              </DataTableCard>
            ))}
          </DataTableCardList>

          <TablePagination
            id="contract-rules"
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
    </div>
  );
}

function ruleSignature(rule: ContractRule): string {
  return [
    contractRuleTitle(rule),
    contractRuleReference(rule),
    contractRuleEffect(rule),
    contractRuleValidity(rule),
  ].join("|");
}

function SourceName({ name }: { name: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="block truncate rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ViewSourceButton({ source }: { source: RuleSourceFile }) {
  if (!source.onView) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Visualizar arquivo de origem ${source.name}`}
            onClick={source.onView}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar arquivo de origem</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
