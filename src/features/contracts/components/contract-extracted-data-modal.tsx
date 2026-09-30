import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { SummaryList } from "@/features/pricing-base";
import { Button } from "@/components/ui/button";
import { formatIsoToBr } from "@/lib/date";

import type { Contract } from "../data/contracts";
import type { ContractRulesDisplayStatus } from "../data/contract-rules";
import { contractRulesQueryKey, listContractRules } from "../data/contract-rules-service";
import { ContractRulesStatusBadge } from "./contract-rules-status-badge";

interface ContractExtractedDataModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Situação atual da extração; o modal só é aberto com extração concluída. */
  status?: ContractRulesDisplayStatus | null;
  /** Oculta o atalho quando o modal já é aberto na própria página de detalhes. */
  showDetailsLink?: boolean;
}

/** Visão resumida dos dados extraídos; o conteúdo completo fica em Detalhes do contrato. */
export function ContractExtractedDataModal({
  contract,
  open,
  onOpenChange,
  status = "available",
  showDetailsLink = true,
}: ContractExtractedDataModalProps) {
  const contractId = contract?.id ?? "";
  const query = useQuery({
    queryKey: contractRulesQueryKey(contractId),
    queryFn: () => listContractRules(contractId),
    enabled: open && contractId !== "",
  });

  const count = query.data
    ? query.data.length.toLocaleString("pt-BR")
    : query.isError
      ? "—"
      : "Carregando...";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="Dados extraídos"
      description={contract?.file.name}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {showDetailsLink && contract && (
            <Button asChild>
              <Link to="/contratos/$contractId" params={{ contractId: contract.id }}>
                <ClipboardList className="size-4" aria-hidden="true" />
                Ver detalhes do contrato
              </Link>
            </Button>
          )}
        </>
      }
    >
      {contract && (
        <SummaryList
          items={[
            { label: "Prestador", value: contract.company },
            {
              label: "CNPJ",
              value: <span className="font-mono">{contract.cnpj || "—"}</span>,
            },
            { label: "Validade", value: formatIsoToBr(contract.validUntil) || "—" },
            { label: "Status da extração", value: <ContractRulesStatusBadge status={status} /> },
            { label: "Quantidade de condições identificadas", value: count },
          ]}
        />
      )}
    </AppModal>
  );
}
