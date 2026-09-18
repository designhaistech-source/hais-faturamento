import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Table2 } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ErrorState, TableSkeleton } from "@/components/data-state";
import { SurfaceCard } from "@/components/surface-card";
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

import { NewPricingVersionModal } from "./new-pricing-version-modal";
import {
  formatVersionDateTime,
  type NewPricingVersionInput,
  type PricingVersion,
} from "../data/pricing-versions";
import {
  createPricingVersion,
  createPricingVersionFileUrl,
  listPricingVersions,
  pricingVersionsQueryKey,
} from "../data/pricing-versions-service";

const COLUMNS = ["Arquivo", "Cadastrado por", "Data do cadastro", "Ações"] as const;

async function downloadVersionFile(version: PricingVersion) {
  try {
    const url = await createPricingVersionFileUrl(version.file.path, version.file.name);
    const link = document.createElement("a");
    link.href = url;
    link.download = version.file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    toast.error("Não foi possível baixar o arquivo desta versão.");
  }
}

export function PricingBasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const versionsQuery = useQuery({
    queryKey: pricingVersionsQueryKey,
    queryFn: listPricingVersions,
  });
  const versions = versionsQuery.data ?? [];
  const currentVersionId = versions[0]?.id;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(versions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedVersions = useMemo(
    () => versions.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [versions, currentPage, pageSize],
  );

  const createMutation = useMutation({
    mutationFn: (input: NewPricingVersionInput) => createPricingVersion(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pricingVersionsQueryKey });
      setPage(1);
      toast.success("Versão cadastrada com sucesso.");
    },
    onError: () => {
      toast.error("Não foi possível cadastrar a versão.");
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
              description="Gerencie a base de valores utilizada na análise do faturamento."
              actions={
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Cadastrar nova versão
                </Button>
              }
            />

            <section className="space-y-4">
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
                  Histórico de versões
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A versão mais recente é utilizada nas novas análises.
                </p>
              </div>

              {versionsQuery.isPending ? (
                <SurfaceCard padding="none">
                  <TableSkeleton rows={4} columns={4} />
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
                  icon={<Table2 className="size-10" aria-hidden="true" />}
                  title="Nenhuma versão cadastrada"
                  description="Cadastre a base de precificação para começar."
                  action={
                    <Button type="button" onClick={() => setModalOpen(true)}>
                      <Plus className="size-4" aria-hidden="true" />
                      Cadastrar primeira versão
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
                                <VersionFileName name={version.file.name} />
                                {version.id === currentVersionId && (
                                  <Badge variant="success-soft" size="sm" className="shrink-0">
                                    Atual
                                  </Badge>
                                )}
                              </div>
                            </DataTableCell>
                            <DataTableCell>{version.createdBy}</DataTableCell>
                            <DataTableCell>
                              {formatVersionDateTime(version.createdAt)}
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
                      <DataTableCard key={version.id} flat>
                        <DataTableCardHeader
                          title={<VersionFileName name={version.file.name} />}
                          trailing={
                            version.id === currentVersionId ? (
                              <Badge variant="success-soft" size="sm">
                                Atual
                              </Badge>
                            ) : undefined
                          }
                        />
                        <DataTableCardFields
                          fields={[
                            { label: "Cadastrado por", value: version.createdBy },
                            {
                              label: "Data do cadastro",
                              value: formatVersionDateTime(version.createdAt),
                            },
                          ]}
                        />
                        <DataTableCardActions className="justify-end">
                          <VersionActions version={version} />
                        </DataTableCardActions>
                      </DataTableCard>
                    ))}
                  </DataTableCardList>

                  <TablePagination
                    id="pricing-versions"
                    totalItems={versions.length}
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
          </main>

          <SiteFooter />
        </div>
      </div>

      <NewPricingVersionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreate={(input) => createMutation.mutate(input)}
      />
    </TooltipProvider>
  );
}

/** Nome do arquivo truncado, com o valor completo em tooltip (mouse e teclado). */
function VersionFileName({ name }: { name: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="block min-w-0 truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {name}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 break-all">{name}</TooltipContent>
    </Tooltip>
  );
}

/** Ações da linha: apenas baixar o arquivo original da versão. */
function VersionActions({ version }: { version: PricingVersion }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Baixar ${version.file.name}`}
            onClick={() => void downloadVersionFile(version)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Baixar</TooltipContent>
      </Tooltip>
    </div>
  );
}
