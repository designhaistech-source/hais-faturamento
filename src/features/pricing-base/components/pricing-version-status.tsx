import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock,
  Copy,
  FileX2,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

import type { PricingVersion, PricingVersionStatus } from "../data/pricing-versions";

const STATUS_META: Record<
  PricingVersionStatus,
  { label: string; tone: StatusTone; icon: LucideIcon; spinning?: boolean }
> = {
  PENDING: { label: "Aguardando", tone: "neutral", icon: Clock },
  PROCESSING: { label: "Processando...", tone: "info", icon: Loader2, spinning: true },
  EXTRACTED: { label: "Processado", tone: "success", icon: CheckCircle2 },
  PARTIALLY_EXTRACTED: { label: "Processado parcialmente", tone: "warning", icon: AlertTriangle },
  INVALID_FILE: { label: "Arquivo inválido", tone: "danger", icon: FileX2 },
  PROCESSING_ERROR: { label: "Erro no processamento", tone: "danger", icon: XCircle },
  DUPLICATE_FILE: { label: "Arquivo duplicado", tone: "warning", icon: Copy },
};

export function PricingVersionStatusBadge({ status }: { status: PricingVersionStatus }) {
  const meta = STATUS_META[status];
  return (
    <StatusBadge tone={meta.tone} icon={meta.icon} label={meta.label} spinning={meta.spinning} />
  );
}

interface PricingProcessingDetailsModalProps {
  version: PricingVersion | null;
  onOpenChange: (open: boolean) => void;
  onRetry: (version: PricingVersion) => void;
  onUploadNew: () => void;
}

/** Explains, in plain language, what happened while processing a file. */
export function PricingProcessingDetailsModal({
  version,
  onOpenChange,
  onRetry,
  onUploadNew,
}: PricingProcessingDetailsModalProps) {
  const showUpload =
    version !== null &&
    ["INVALID_FILE", "PARTIALLY_EXTRACTED", "PROCESSING_ERROR", "DUPLICATE_FILE"].includes(
      version.status,
    );
  const showRetry = version !== null && version.status === "PROCESSING_ERROR" && version.retryable;

  return (
    <AppModal
      open={version !== null}
      onOpenChange={onOpenChange}
      title="Detalhes do processamento"
      icon={<CircleAlert className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {showUpload && (
            <Button type="button" variant={showRetry ? "outline" : "default"} onClick={onUploadNew}>
              <Upload className="size-4" aria-hidden="true" />
              Enviar novo arquivo
            </Button>
          )}
          {showRetry && version && (
            <Button type="button" onClick={() => onRetry(version)}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Tentar novamente
            </Button>
          )}
        </>
      }
    >
      {version && (
        <div className="space-y-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Arquivo</dt>
              <dd className="break-all text-sm text-foreground">{version.file.name}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Status</dt>
              <dd>
                <PricingVersionStatusBadge status={version.status} />
              </dd>
            </div>
          </dl>

          <section className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-foreground">O que aconteceu</h3>
            <p className="text-sm text-muted-foreground">
              {version.statusProblem ?? "Não há detalhes adicionais sobre este processamento."}
            </p>
            {version.status === "PARTIALLY_EXTRACTED" && version.unprocessedCount !== null && (
              <div className="space-y-2 pt-1">
                <p className="text-sm text-foreground">
                  Registros não processados:{" "}
                  <span className="font-mono font-semibold">{version.unprocessedCount}</span>
                </p>
                {version.unprocessedReasons.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {version.unprocessedReasons.map((item) => (
                      <li key={item.reason}>
                        {item.reason}: <span className="font-mono">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {version.statusGuidance && (
            <section className="space-y-1.5">
              <h3 className="font-display text-sm font-semibold text-foreground">Como resolver</h3>
              <p className="text-sm text-muted-foreground">{version.statusGuidance}</p>
            </section>
          )}
        </div>
      )}
    </AppModal>
  );
}
