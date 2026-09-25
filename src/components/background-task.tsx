import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleCheck, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TaskMessage {
  title: string;
  description: string;
}

export interface BackgroundTaskOutcome extends TaskMessage {
  action?: { label: string; onSelect: () => void };
  /** Semântica do resultado; padrão "success". */
  tone?: "success" | "warning" | "danger";
}

/** Descrição de uma tarefa longa: textos de cada estado e o trabalho a executar. */
export interface BackgroundTaskDefinition {
  /** Identifica o tipo de processamento, p. ex. para desabilitar ações do mesmo tipo. */
  kind: string;
  fileName: string;
  processing: TaskMessage;
  failure: TaskMessage;
  run: () => Promise<BackgroundTaskOutcome>;
  /** Omitido quando repetir com os mesmos dados não faz sentido. */
  retryable?: boolean;
}

type TaskState = { id: number } & (
  | { status: "processing"; task: BackgroundTaskDefinition }
  | { status: "completed"; task: BackgroundTaskDefinition; outcome: BackgroundTaskOutcome }
  | { status: "failed"; task: BackgroundTaskDefinition }
);

interface BackgroundTaskContextValue {
  isProcessing: (kind: string) => boolean;
  start: (task: BackgroundTaskDefinition) => void;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextValue | null>(null);

/**
 * Aviso global de processamento em segundo plano (análises, extração de regras).
 * Fica na raiz para sobreviver à navegação; não bloqueia a interface.
 */
export function BackgroundTaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskState[]>([]);
  const nextId = useRef(0);

  // Cada tarefa atualiza apenas o próprio card; as demais seguem intactas.
  const update = useCallback((next: TaskState) => {
    setTasks((current) => current.map((item) => (item.id === next.id ? next : item)));
  }, []);

  const run = useCallback(
    (id: number, task: BackgroundTaskDefinition) => {
      task
        .run()
        .then((outcome) => update({ id, status: "completed", task, outcome }))
        .catch(() => update({ id, status: "failed", task }));
    },
    [update],
  );

  const start = useCallback(
    (task: BackgroundTaskDefinition) => {
      nextId.current += 1;
      const id = nextId.current;
      setTasks((current) => [...current, { id, status: "processing", task }]);
      run(id, task);
    },
    [run],
  );

  const retry = useCallback(
    (id: number, task: BackgroundTaskDefinition) => {
      update({ id, status: "processing", task });
      run(id, task);
    },
    [run, update],
  );

  const dismiss = useCallback((id: number) => {
    setTasks((current) => current.filter((item) => item.id !== id));
  }, []);

  const isProcessing = useCallback(
    (kind: string) => tasks.some((item) => item.status === "processing" && item.task.kind === kind),
    [tasks],
  );

  const value = useMemo(() => ({ isProcessing, start }), [isProcessing, start]);

  return (
    <BackgroundTaskContext.Provider value={value}>
      {children}
      {tasks.length > 0 && (
        <div className="fixed right-4 bottom-4 left-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96">
          {tasks.map((item) => (
            <BackgroundTaskIndicator
              key={item.id}
              state={item}
              onDismiss={() => dismiss(item.id)}
              onRetry={(task) => retry(item.id, task)}
            />
          ))}
        </div>
      )}
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
            icon:
              state.outcome.tone === "warning" ? (
                <TriangleAlert className="size-5 text-warning" aria-hidden="true" />
              ) : state.outcome.tone === "danger" ? (
                <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />
              ) : (
                <CircleCheck className="size-5 text-success" aria-hidden="true" />
              ),
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
      className="rounded-xl border border-border bg-card p-4 shadow-lg"
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
