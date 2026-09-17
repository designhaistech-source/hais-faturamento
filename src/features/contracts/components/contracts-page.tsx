import { useState } from "react";
import { Download, Eye, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/data-state";
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
  DataTableEmptyRow,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";
import { formatIsoToBr } from "@/lib/date";
import { NewContractModal } from "./new-contract-modal";
import type { Contract } from "../data/contracts";

const COLUMNS = ["Empresa", "CNPJ", "Validade", "Contrato", "Ações"] as const;

function openContractFile(contract: Contract) {
  const opened = window.open(contract.file.url, "_blank", "noopener,noreferrer");
  if (!opened) toast.error("Não foi possível abrir o arquivo do contrato.");
}

function downloadContractFile(contract: Contract) {
  const link = document.createElement("a");
  link.href = contract.file.url;
  link.download = contract.file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  function handleCreate(contract: Contract) {
    setContracts((current) => [contract, ...current]);
    toast.success("Contrato cadastrado.");
  }

  const empty = (
    <EmptyState
      icon={<FileText className="size-10" aria-hidden="true" />}
      title="Nenhum contrato cadastrado"
      description="Cadastre o primeiro contrato para acompanhar as clínicas e hospitais atendidos."
      action={
        <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Novo contrato
        </Button>
      }
    />
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeKey="contratos" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
          <main className="flex-1 space-y-6 p-6 pb-16">
            <AppBreadcrumb />
            <PageHeader
              title="Contratos"
              description="Contratos das clínicas e hospitais cadastrados no HaisFaturamento."
              actions={
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Novo contrato
                </Button>
              }
            />

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
                    {contracts.length === 0 ? (
                      <DataTableEmptyRow colSpan={COLUMNS.length}>{empty}</DataTableEmptyRow>
                    ) : (
                      contracts.map((contract) => (
                        <DataTableRow key={contract.id}>
                          <DataTableCell className="font-medium">{contract.company}</DataTableCell>
                          <DataTableCell className="font-mono text-xs">
                            {contract.cnpj || "—"}
                          </DataTableCell>
                          <DataTableCell>{formatIsoToBr(contract.validUntil) || "—"}</DataTableCell>
                          <DataTableCell className="max-w-[18rem]">
                            <span className="block truncate" title={contract.file.name}>
                              {contract.file.name}
                            </span>
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            <ContractActions contract={contract} />
                          </DataTableCell>
                        </DataTableRow>
                      ))
                    )}
                  </DataTableBody>
                </DataTableRoot>
              </DataTableDesktop>

              <DataTableCardList divided>
                {contracts.length === 0 ? (
                  <li>{empty}</li>
                ) : (
                  contracts.map((contract) => (
                    <DataTableCard key={contract.id} flat>
                      <DataTableCardHeader title={contract.company} subtitle={contract.file.name} />
                      <DataTableCardFields
                        fields={[
                          { label: "CNPJ", value: contract.cnpj || "—" },
                          {
                            label: "Validade",
                            value: formatIsoToBr(contract.validUntil) || "—",
                          },
                        ]}
                      />
                      <DataTableCardActions className="justify-end">
                        <ContractActions contract={contract} />
                      </DataTableCardActions>
                    </DataTableCard>
                  ))
                )}
              </DataTableCardList>
            </DataTable>
          </main>
          <SiteFooter />
        </div>
      </div>

      <NewContractModal open={modalOpen} onOpenChange={setModalOpen} onCreate={handleCreate} />
    </TooltipProvider>
  );
}

/** Ações da linha: apenas visualizar e baixar, identificadas por tooltip. */
function ContractActions({ contract }: { contract: Contract }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Visualizar contrato de ${contract.company}`}
            onClick={() => openContractFile(contract)}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Baixar contrato de ${contract.company}`}
            onClick={() => downloadContractFile(contract)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Baixar</TooltipContent>
      </Tooltip>
    </div>
  );
}
