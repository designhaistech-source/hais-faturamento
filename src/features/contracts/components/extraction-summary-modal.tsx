import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { SummaryList } from "@/features/pricing-base";

import { extractionDateOf } from "../data/contract-rule-details";
import { contractRulesQueryKey, listContractRules } from "../data/contract-rules-service";

export interface ExtractionSummaryTarget {
  contractId: string;
  /** Nulo para o contrato original. */
  amendmentId: string | null;
  /** Segmento da URL da página da operadora. */
  operatorId: string;
  fileName: string;
  kind: string;
  status: ReactNode;
  /** Só busca as regras quando a extração foi concluída. */
  available: boolean;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Visão resumida da extração; o detalhamento fica em "Detalhes da extração". */
export function ExtractionSummaryModal({
  target,
  onOpenChange,
}: {
  target: ExtractionSummaryTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const query = useQuery({
    queryKey: contractRulesQueryKey(target?.contractId ?? "", target?.amendmentId ?? null),
    queryFn: () => listContractRules(target!.contractId, target!.amendmentId),
    enabled: target !== null && target.available,
  });

  const loading = target?.available && query.isPending ? "Carregando..." : null;
  const count = !target?.available
    ? "—"
    : (loading ?? (query.data ? query.data.length.toLocaleString("pt-BR") : "—"));
  const extractedAt = query.data ? extractionDateOf(query.data) : null;
  const date = !target?.available
    ? "—"
    : (loading ?? (extractedAt ? formatDateTime(extractedAt) : "—"));

  return (
    <AppModal
      open={target !== null}
      onOpenChange={onOpenChange}
      size="md"
      title="Resumo da extração"
      description={target?.fileName}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {target && (
            <Button asChild>
              <Link
                to="/contratos/$contractId/extracao/$fileId"
                params={{
                  contractId: target.operatorId,
                  fileId: target.amendmentId ?? target.contractId,
                }}
              >
                <ClipboardList className="size-4" aria-hidden="true" />
                Ver detalhes da extração
              </Link>
            </Button>
          )}
        </>
      }
    >
      {target && (
        <SummaryList
          items={[
            { label: "Status da extração", value: target.status },
            { label: "Tipo do arquivo", value: target.kind },
            { label: "Regras identificadas", value: count },
            { label: "Data da extração", value: date },
          ]}
        />
      )}
    </AppModal>
  );
}
