import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CircleCheck, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TaskMessage {
  title: string;
  description: string;
}

export interface BackgroundTaskOutcome extends TaskMessage {
  action?: { label: string; onSelect: () => void };
}

/** Descrição de uma tarefa longa: textos de cada estado e o trabalho a executar. */
export interface BackgroundTaskDefinition {
  fileName: string;
  processing: TaskMessage;
  failure: TaskMessage;
  run: () => Promise<BackgroundTaskOutcome>;
  /** Omitido quando repetir com os mesmos dados não faz sentido. */
  retryable?: boolean;
}

type TaskState =
  | { status: "idle" }
  | { status: "processing"; task: BackgroundTaskDefinition }
  | { status: "completed"; task: BackgroundTaskDefinition; outcome: BackgroundTaskOutcome }
  | { status: "failed"; task: BackgroundTaskDefinition };

interface BackgroundTaskContextValue {
  isProcessing: boolean;
  start: (task: BackgroundTaskDefinition) => void;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextValue | null>(null);

/**
 * Aviso global de processamento em segundo plano (análises, extração de regras).
 * Fica na raiz para sobreviver à navegação; não bloqueia a interface.
 */
export function BackgroundTaskProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TaskState>({ status: "idle" });

  const start = useCallback((task: BackgroundTaskDefinition) => {
    setState({ status: "processing", task });
    task
      .run()
      .then((outcome) => setState({ status: "completed", task, outcome }))
      .catch(() => setState({ status: "failed", task }));
  }, []);

  const value = useMemo(
    () => ({ isProcessing: state.status === "processing", start }),
    [state.status, start],
  );

  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
      <BackgroundTaskIndicator
        state={state}
        onDismiss={() => setState({ status: "idle" })}
        onRetry={start}
      />
    </BackgroundTaskContext.Provider>
  );
}

export function useBackgroundTask(): BackgroundTaskContextValue {
  const context = useContext(BackgroundTaskContext);
  if (!context) throw new Error("useBackgroundTask precisa do BackgroundTaskProvider.");
  return context;
}

function BackgroundTaskIndicator({
  state,
  onDismiss,
  onRetry,
}: {
  state: TaskState;
  onDismiss: () => void;
  onRetry: (task: BackgroundTaskDefinition) => void;
}) {
  if (state.status === "idle") return null;
  const { task } = state;

  const content =
    state.status === "processing"
      ? {
          icon: (
            <LoaderCircle
              className="size-5 animate-spin text-primary motion-reduce:animate-none"
              aria-hidden="true"
            />
          ),
          ...task.processing,
          hint: "Você pode continuar usando o sistema.",
        }
      : state.status === "completed"
        ? {
            icon: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
            title: state.outcome.title,
            description: state.outcome.description,
            hint: null,
          }
        : {
            icon: <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />,
            ...task.failure,
            hint: null,
          };

  const action = state.status === "completed" ? state.outcome.action : undefined;

  return (
    <div
      role={state.status === "failed" ? "alert" : "status"}
      aria-live="polite"
      className="fixed right-4 bottom-4 left-4 z-50 rounded-xl border border-border bg-card p-4 shadow-lg sm:left-auto sm:w-96"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{content.icon}</span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">{content.title}</p>
          <p className="truncate font-mono text-xs text-muted-foreground" title={task.fileName}>
            {task.fileName}
          </p>
          <p className="text-sm text-muted-foreground">{content.description}</p>
          {content.hint && <p className="text-xs text-muted-foreground">{content.hint}</p>}
          {action && (
            <div className="pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onDismiss();
                  action.onSelect();
                }}
              >
                {action.label}
              </Button>
            </div>
          )}
          {state.status === "failed" && task.retryable !== false && (
            <div className="pt-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onRetry(task)}>
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
            aria-label="Fechar aviso de processamento"
            onClick={onDismiss}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
