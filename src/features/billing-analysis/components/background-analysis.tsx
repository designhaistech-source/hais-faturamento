import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CircleCheck, TriangleAlert, LoaderCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  billingAnalysesQueryKey,
  getAnalysisOutcomeCounts,
  runBillingAnalysis,
  type AnalysisOutcomeCounts,
  type RunBillingAnalysisInput,
} from "../data/billing-analyses-service";

type BackgroundAnalysisState =
  | { status: "idle" }
  | { status: "processing"; input: RunBillingAnalysisInput }
  | {
      status: "completed";
      input: RunBillingAnalysisInput;
      analysisId: string;
      counts: AnalysisOutcomeCounts | null;
    }
  | { status: "failed"; input: RunBillingAnalysisInput };

interface BackgroundAnalysisContextValue {
  isProcessing: boolean;
  start: (input: RunBillingAnalysisInput) => void;
}

const BackgroundAnalysisContext = createContext<BackgroundAnalysisContextValue | null>(null);

/**
 * Executa a análise de faturamento fora do modal, sem bloquear a interface.
 * Fica na raiz da aplicação para que o aviso sobreviva à navegação entre páginas.
 */
export function BackgroundAnalysisProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BackgroundAnalysisState>({ status: "idle" });

  const start = useCallback(
    (input: RunBillingAnalysisInput) => {
      setState({ status: "processing", input });
      void queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey });
      runBillingAnalysis(input)
        .then(async (analysisId) => {
          // As contagens são apenas informativas; sem elas o aviso ainda indica a conclusão.
          const counts = await getAnalysisOutcomeCounts(analysisId).catch(() => null);
          setState({ status: "completed", input, analysisId, counts });
        })
        .catch(() => setState({ status: "failed", input }))
        .finally(() => void queryClient.invalidateQueries({ queryKey: billingAnalysesQueryKey }));
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ isProcessing: state.status === "processing", start }),
    [state.status, start],
  );

  return (
    <BackgroundAnalysisContext.Provider value={value}>
      {children}
      <BackgroundAnalysisIndicator
        state={state}
        onDismiss={() => setState({ status: "idle" })}
        onRetry={start}
      />
    </BackgroundAnalysisContext.Provider>
  );
}

export function useBackgroundAnalysis(): BackgroundAnalysisContextValue {
  const context = useContext(BackgroundAnalysisContext);
  if (!context) throw new Error("useBackgroundAnalysis precisa do BackgroundAnalysisProvider.");
  return context;
}

function BackgroundAnalysisIndicator({
  state,
  onDismiss,
  onRetry,
}: {
  state: BackgroundAnalysisState;
  onDismiss: () => void;
  onRetry: (input: RunBillingAnalysisInput) => void;
}) {
  if (state.status === "idle") return null;
  const fileName = state.input.file.name;

  const content =
    state.status === "processing"
      ? {
          icon: (
            <LoaderCircle
              className="size-5 animate-spin text-primary motion-reduce:animate-none"
              aria-hidden="true"
            />
          ),
          title: "Analisando faturamento",
          description: "Processando análise...",
          hint: "Você pode continuar usando o sistema.",
        }
      : state.status === "completed"
        ? {
            icon: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
            title: "Análise concluída",
            description: describeOutcome(state.counts),
            hint: null,
          }
        : {
            icon: <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />,
            title: "Não foi possível concluir a análise",
            description: "Não foi possível processar o arquivo.",
            hint: null,
          };

  return (
    <div
      role={state.status === "failed" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "fixed right-4 bottom-4 left-4 z-50 rounded-xl border border-border bg-card p-4 shadow-lg sm:left-auto sm:w-96",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{content.icon}</span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">{content.title}</p>
          <p className="truncate font-mono text-xs text-muted-foreground" title={fileName}>
            {fileName}
          </p>
          <p className="text-sm text-muted-foreground">{content.description}</p>
          {content.hint && <p className="text-xs text-muted-foreground">{content.hint}</p>}
          {state.status === "completed" && (
            <div className="pt-2">
              <Button asChild size="sm">
                <Link
                  to="/analise-faturamento/$analysisId/resultado"
                  params={{ analysisId: state.analysisId }}
                  onClick={onDismiss}
                >
                  Ver resultado
                </Link>
              </Button>
            </div>
          )}
          {state.status === "failed" && (
            <div className="pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRetry(state.input)}
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
        {state.status !== "processing" && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-1 size-8 shrink-0"
            aria-label="Fechar aviso da análise"
            onClick={onDismiss}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
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
