import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/data-state";

import { UNIDENTIFIED_LABEL, type BillingAnalysis } from "../data/billing-analyses";
import {
  analysisDetailsQueryKey,
  appliedRuleLabel,
  formatAdjustment,
  formatCurrency,
  formatDecimal,
  getAnalysisDetails,
  referenceLabel,
  type AnalysisItemDetail,
} from "../data/analysis-details";
import { differenceOf, expectedOf, ItemStatusBadge } from "./analysis-details-page";

interface AnalysisResultModalProps {
  analysis: BillingAnalysis | null;
  onClose: () => void;
}

/** Consulta rápida dos itens que exigem atenção (divergências e não analisados). */
export function AnalysisResultModal({ analysis, onClose }: AnalysisResultModalProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
            setExpanded(new Set());
            onClose();
          }
        }}
        title="Resultado da análise"
        description={analysis?.fileName}
        size="lg"
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setExpanded(new Set());
              onClose();
            }}
          >
            Fechar
          </Button>
        }
      >
        {analysis && (
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
                      <ItemStatusBadge status={item.status} />
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
                    {item.status === "divergent" && (
                      <RuleSummary
                        item={item}
                        expanded={expanded.has(item.id)}
                        onToggle={() => toggle(item.id)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
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

function ruleParts(item: AnalysisItemDetail): string[] {
  const parts: string[] = [];
  const rule = appliedRuleLabel(item.ruleDescription);
  if (rule !== "—") parts.push(rule);
  if (item.referenceType && item.referenceType !== "none" && item.referenceType !== "contract") {
    parts.push(referenceLabel(item));
  }
  if (item.adjustmentPercent !== null && item.adjustmentPercent !== 0) {
    parts.push(formatAdjustment(item.adjustmentPercent));
  }
  return parts;
}

function RuleSummary({
  item,
  expanded,
  onToggle,
}: {
  item: AnalysisItemDetail;
  expanded: boolean;
  onToggle: () => void;
}) {
  const parts = ruleParts(item);
  const hasMemory = item.calculation !== null || item.referenceValue !== null;
  const panelId = `calc-${item.id}`;
  if (parts.length === 0 && !hasMemory) return null;
  return (
    <div className="space-y-1.5">
      {parts.length > 0 && <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>}
      {hasMemory && (
        <>
          <button
            type="button"
            className="rounded-sm text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={onToggle}
          >
            {expanded ? "Ocultar cálculo" : "Ver cálculo"}
          </button>
          {expanded && (
            <dl id={panelId} className="space-y-1 rounded-md bg-muted px-3 py-2 text-xs">
              {item.referenceValue !== null && (
                <CalcRow label="Valor de referência" value={formatCurrency(item.referenceValue)} />
              )}
              {item.factor !== null && item.factor !== 1 && (
                <CalcRow label="Fator" value={formatDecimal(item.factor)} />
              )}
              {item.quantity > 1 && (
                <CalcRow label="Quantidade" value={formatDecimal(item.quantity)} />
              )}
              {item.calculation && <CalcRow label="Cálculo" value={item.calculation} />}
            </dl>
          )}
        </>
      )}
    </div>
  );
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-1">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="break-words font-mono text-foreground">{value}</dd>
    </div>
  );
}
