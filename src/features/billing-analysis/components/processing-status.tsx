import { useState } from "react";
import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Copy,
  FileX,
  LoaderCircle,
  RotateCw,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import {
  formatAnalysisDateTime,
  PROCESSING_STATUS_LABEL,
  type BillingAnalysis,
  type ProcessingStatus,
} from "../data/billing-analyses";

const STATUS_VISUAL: Record<ProcessingStatus, { tone: StatusTone; icon: LucideIcon }> = {
  PENDING: { tone: "neutral", icon: Clock },
  PROCESSING: { tone: "info", icon: LoaderCircle },
  EXTRACTED: { tone: "success", icon: CircleCheck },
  PARTIALLY_EXTRACTED: { tone: "warning", icon: TriangleAlert },
  INVALID_FILE: { tone: "danger", icon: FileX },
  PROCESSING_ERROR: { tone: "danger", icon: CircleX },
  DUPLICATE_FILE: { tone: "neutral", icon: Copy },
};

/** Status técnico do processamento do arquivo (informativo, não clicável). */
export function ProcessingStatusBadge({ status }: { status: ProcessingStatus }) {
  const visual = STATUS_VISUAL[status];
  return (
    <StatusBadge
      tone={visual.tone}
      icon={visual.icon}
      label={PROCESSING_STATUS_LABEL[status]}
      spinning={status === "PROCESSING"}
    />
  );
}

interface Guidance {
  explanation: string;
  resolution: string;
}

function guidanceFor(analysis: BillingAnalysis): Guidance {
  switch (analysis.processingStatus) {
    case "INVALID_FILE":
      return analysis.errorMessage?.includes("Nenhum item")
        ? {
            explanation:
              "O arquivo foi lido, mas não contém itens faturados reconhecíveis no padrão TISS.",
            resolution:
              "Confira se o arquivo exportado é o lote de faturamento completo, com guias e itens, e envie-o novamente.",
          }
        : {
            explanation:
              "O arquivo enviado não pôde ser lido como XML. Ele pode estar corrompido, incompleto ou em outro formato.",
            resolution:
              "Gere o arquivo XML TISS novamente no sistema de origem e faça uma nova análise.",
          };
    case "PROCESSING_ERROR":
      return {
        explanation:
          "Ocorreu um erro interno durante o processamento do arquivo e as tentativas automáticas se esgotaram. A análise não foi concluída e nenhum resultado foi gerado.",
        resolution:
          "Use Tentar novamente para colocar o arquivo de volta na fila de processamento. Se a falha continuar, verifique se o contrato possui dados extraídos e se as bases de precificação estão cadastradas.",
      };
    case "PARTIALLY_EXTRACTED":
      return {
        explanation:
          "O arquivo foi processado, mas algumas guias ou itens estão em formato não suportado e não puderam ser extraídos. Esses trechos ficaram fora da análise. Itens extraídos que não puderam ser precificados aparecem como Não analisado no resultado.",
        resolution:
          "Revise os trechos listados abaixo no arquivo original. Após corrigi-los, faça uma nova análise para obter o resultado completo.",
      };
    case "DUPLICATE_FILE":
      return {
        explanation: "Este mesmo arquivo já foi analisado anteriormente para este contrato.",
        resolution:
          "Consulte a análise existente. Se o arquivo foi alterado, confirme que está enviando a versão correta.",
      };
    default:
      return {
        explanation: "O arquivo foi processado normalmente.",
        resolution: "Nenhuma ação é necessária.",
      };
  }
}

interface ProcessingDetailsModalProps {
  analysis: BillingAnalysis | null;
  onOpenChange: (open: boolean) => void;
  /** Reprocessa a análise; exibido apenas para falhas no processamento. */
  onRetry?: (analysis: BillingAnalysis) => void;
  retryDisabled?: boolean;
}

/** Explica o que aconteceu no processamento do arquivo e como resolver. */
export function ProcessingDetailsModal({
  analysis,
  onOpenChange,
  onRetry,
  retryDisabled,
}: ProcessingDetailsModalProps) {
  const [technicalOpen, setTechnicalOpen] = useState(false);
  if (!analysis) return null;

  const guidance = guidanceFor(analysis);
  const details = analysis.processingDetails;
  const skipped = details.skippedParts ?? [];
  const technical = details.technicalMessage ?? analysis.errorMessage ?? null;

  return (
    <AppModal
      open
      onOpenChange={(open) => {
        if (!open) setTechnicalOpen(false);
        onOpenChange(open);
      }}
      title="Detalhes do processamento"
      description="Informações sobre o processamento técnico do arquivo."
      descriptionHidden
      icon={<CircleAlert className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onRetry && analysis.processingStatus === "PROCESSING_ERROR" && (
            <Button type="button" disabled={retryDisabled} onClick={() => onRetry(analysis)}>
              <RotateCw className="size-4" aria-hidden="true" />
              Tentar novamente
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5 text-sm">
        <dl className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="text-xs font-medium text-muted-foreground">Arquivo</dt>
          <dd className="break-all text-foreground">{analysis.fileName}</dd>
          <dt className="text-xs font-medium text-muted-foreground">Status</dt>
          <dd>
            <ProcessingStatusBadge status={analysis.processingStatus} />
          </dd>
        </dl>

        <section className="space-y-1">
          <h3 className="font-display text-sm font-semibold text-foreground">O que aconteceu</h3>
          <p className="text-muted-foreground">{guidance.explanation}</p>
        </section>

        {analysis.processingStatus === "PARTIALLY_EXTRACTED" && skipped.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-foreground">
              Trechos não processados ({skipped.length})
            </h3>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-3">
              {skipped.map((part) => (
                <li key={part.position} className="text-muted-foreground">
                  Item {part.position} do arquivo{" "}
                  <span className="font-mono text-xs">&lt;{part.tag}&gt;</span> — formato não
                  suportado
                </li>
              ))}
            </ul>
          </section>
        )}

        {analysis.processingStatus === "DUPLICATE_FILE" && details.duplicateOf && (
          <p className="text-muted-foreground">
            Análise anterior realizada em {formatAnalysisDateTime(details.duplicateOf.analyzedAt)}.
          </p>
        )}

        <section className="space-y-1">
          <h3 className="font-display text-sm font-semibold text-foreground">Como resolver</h3>
          <p className="text-muted-foreground">{guidance.resolution}</p>
        </section>

        {technical && (
          <Collapsible open={technicalOpen} onOpenChange={setTechnicalOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground"
              >
                <ChevronDown
                  className={
                    technicalOpen
                      ? "size-4 rotate-180 transition-transform motion-reduce:transition-none"
                      : "size-4 transition-transform motion-reduce:transition-none"
                  }
                  aria-hidden="true"
                />
                Informações técnicas
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
                {technical}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </AppModal>
  );
}
