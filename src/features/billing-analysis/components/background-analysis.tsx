import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useBackgroundTask } from "@/components/background-task";

import {
  billingAnalysesQueryKey,
  getAnalysisOutcomeCounts,
  runBillingAnalysis,
  type AnalysisOutcomeCounts,
  type RunBillingAnalysisInput,
} from "../data/billing-analyses-service";

interface BackgroundAnalysisValue {
  isProcessing: boolean;
  start: (input: RunBillingAnalysisInput) => void;
}

/** Executa a análise de faturamento no aviso global de segundo plano. */
export function useBackgroundAnalysis(): BackgroundAnalysisValue {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const tasks = useBackgroundTask();

  const start = useCallback(
    (input: RunBillingAnalysisInput) => {
      tasks.start({
        kind: "billing-analysis",
        fileName: input.file.name,
        processing: { title: "Analisando faturamento", description: "Processando análise..." },
        failure: {
          title: "Não foi possível concluir a análise",
          description: "Não foi possível processar o arquivo.",
        },
        run: async () => {
          void queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey });
          try {
            const analysisId = await runBillingAnalysis(input);
            // Contagens apenas informativas; sem elas o aviso ainda indica a conclusão.
            const counts = await getAnalysisOutcomeCounts(analysisId).catch(() => null);
            return {
              title: "Análise concluída",
              description: describeOutcome(counts),
              action: {
                label: "Ver resultado",
                onSelect: () =>
                  void navigate({
                    to: "/analise-faturamento/$analysisId/resultado",
                    params: { analysisId },
                  }),
              },
            };
          } finally {
            void queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey });
          }
        },
      });
    },
    [tasks, queryClient, navigate],
  );

  return useMemo(
    () => ({ isProcessing: tasks.isProcessing("billing-analysis"), start }),
    [tasks, start],
  );
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function describeOutcome(counts: AnalysisOutcomeCounts | null): string {
  if (!counts) return "A análise foi concluída.";
  const parts: string[] = [];
  if (counts.divergenceCount > 0) {
    parts.push(
      plural(counts.divergenceCount, "divergência identificada", "divergências identificadas"),
    );
  }
  if (counts.unanalyzedCount > 0) {
    parts.push(plural(counts.unanalyzedCount, "item não analisado", "itens não analisados"));
  }
  return parts.length > 0 ? parts.join(" · ") : "Nenhuma divergência identificada.";
}
