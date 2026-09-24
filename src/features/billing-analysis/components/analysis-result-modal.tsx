import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/data-state";

import { UNIDENTIFIED_LABEL, type BillingAnalysis } from "../data/billing-analyses";
import {
  analysisDetailsQueryKey,
  formatCurrency,
  getAnalysisDetails,
  type AnalysisItemDetail,
} from "../data/analysis-details";
import {
  DetailsButton,
  differenceOf,
  expectedOf,
  ItemDetailsContent,
  ItemStatusBadge,
} from "./analysis-details-page";

interface AnalysisResultModalProps {
  analysis: BillingAnalysis | null;
  onClose: () => void;
}

/** Consulta rápida dos itens que exigem atenção (divergências e não analisados). */
export function AnalysisResultModal({ analysis, onClose }: AnalysisResultModalProps) {
  const [selected, setSelected] = useState<AnalysisItemDetail | null>(null);
  const showDivergent = (analysis?.divergenceCount ?? 0) > 0;
  const showUnanalyzed = (analysis?.unanalyzedCount ?? 0) > 0;

  const query = useQuery({
    queryKey: analysisDetailsQueryKey(analysis?.id ?? ""),
    queryFn: () => getAnalysisDetails(analysis?.id ?? ""),
    enabled: analysis !== null,
  });

  const items = (query.data?.items ?? []).filter(
    (item) =>
      (showDivergent && item.status === "divergent") ||
      (showUnanalyzed && item.status === "unanalyzed"),
  );

  return (
    <>
      <AppModal
        open={analysis !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            onClose();
          }
        }}
        title={
          selected ? (
            <span className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-ml-2 size-8"
                aria-label="Voltar para o resultado da análise"
                onClick={() => setSelected(null)}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Button>
              Detalhes do item
            </span>
          ) : (
            "Resultado da análise"
          )
        }
        description={selected ? `${selected.code} · ${selected.description}` : analysis?.fileName}
        size="lg"
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelected(null);
              onClose();
            }}
          >
            Fechar
          </Button>
        }
      >
        {selected ? (
          <ItemDetailsContent item={selected} />
        ) : (
          analysis && (
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border p-4 text-sm min-[380px]:grid-cols-3">
                <Info label="Contrato" value={analysis.contractCompany || "—"} />
                <Info label="Prestador" value={analysis.provider || UNIDENTIFIED_LABEL} />
                <Info label="Operadora" value={analysis.healthPlan || UNIDENTIFIED_LABEL} />
              </dl>

              {query.isPending ? (
                <LoadingState title="Carregando itens" />
              ) : query.isError ? (
                <ErrorState
                  title="Não foi possível carregar os itens"
                  description="Tente novamente em alguns instantes."
                  onRetry={() => void query.refetch()}
                />
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {items.map((item) => (
                    <li key={item.id} className="space-y-2 px-4 py-3">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                          <p className="break-words text-sm font-medium text-foreground">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <ItemStatusBadge status={item.status} />
                          <DetailsButton item={item} onOpen={setSelected} />
                        </div>
                      </div>
                      <dl className="grid grid-cols-1 gap-2 text-xs min-[380px]:grid-cols-3">
                        <Info label="Faturado" value={formatCurrency(item.billedValue)} mono />
                        <Info label="Esperado" value={expectedOf(item)} mono />
                        <Info label="Diferença" value={differenceOf(item)} mono />
                      </dl>
                      {item.status === "unanalyzed" && (
                        <p className="rounded-md bg-warning-muted px-3 py-2 text-xs text-foreground">
                          <span className="font-medium">Motivo: </span>
                          {item.reason ?? "Informações insuficientes para o cálculo."}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        )}
      </AppModal>
    </>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "mt-0.5 font-mono text-foreground"
            : "mt-0.5 break-words font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
