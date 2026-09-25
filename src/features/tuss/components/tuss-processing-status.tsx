import {
  CircleAlert,
  CircleCheck,
  CircleX,
  LoaderCircle,
  RotateCw,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

import { tussTableLabel, type TussProcessingStatus, type TussVersion } from "../data/tuss-versions";

const STATUS_PRESENTATION: Record<
  TussProcessingStatus,
  { tone: StatusTone; icon: LucideIcon; label: string; spinning?: boolean }
> = {
  PENDING: { tone: "info", icon: LoaderCircle, label: "Processando", spinning: true },
  PROCESSING: { tone: "info", icon: LoaderCircle, label: "Processando", spinning: true },
  EXTRACTED: { tone: "success", icon: CircleCheck, label: "Processado" },
  PARTIALLY_EXTRACTED: { tone: "warning", icon: TriangleAlert, label: "Processado parcialmente" },
  INVALID_FILE: { tone: "danger", icon: CircleX, label: "Erro no arquivo" },
  PROCESSING_ERROR: { tone: "danger", icon: CircleX, label: "Falha no processamento" },
};

export function TussStatusBadge({ status }: { status: TussProcessingStatus }) {
  return <StatusBadge {...STATUS_PRESENTATION[status]} />;
}

interface TussProcessingDetailsModalProps {
  version: TussVersion | null;
  onOpenChange: (open: boolean) => void;
  onReprocess: (version: TussVersion) => void;
  reprocessing: boolean;
}

export function TussProcessingDetailsModal({
  version,
  onOpenChange,
  onReprocess,
  reprocessing,
}: TussProcessingDetailsModalProps) {
  const processing = version?.processing;
  const canReprocess = processing?.retryable === true;
  const showCounts =
    processing?.status === "PARTIALLY_EXTRACTED" &&
    processing.processedCount !== null &&
    processing.unprocessedCount !== null;

  return (
    <AppModal
      open={version !== null}
      onOpenChange={onOpenChange}
      title="Detalhes do processamento"
      icon={<CircleAlert className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {canReprocess && version && (
            <Button
              type="button"
              size="sm"
              disabled={reprocessing}
              onClick={() => onReprocess(version)}
            >
              <RotateCw className="size-4" aria-hidden="true" />
              Reprocessar
            </Button>
          )}
        </>
      }
    >
      {version && processing && (
        <dl className="space-y-4 text-sm">
          <Detail label="Tabela TUSS">{tussTableLabel(version.tableName)}</Detail>
          <Detail label={version.files.length > 1 ? "Arquivos" : "Arquivo"}>
            <span className="break-all">{version.files.map((file) => file.name).join(", ")}</span>
          </Detail>
          <Detail label="Status">
            <TussStatusBadge status={processing.status} />
          </Detail>
          {showCounts && (
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Registros processados">
                <span className="font-mono">{processing.processedCount}</span>
              </Detail>
              <Detail label="Registros não processados">
                <span className="font-mono">{processing.unprocessedCount}</span>
              </Detail>
            </div>
          )}
          <Detail label="Problema identificado">{processing.problem ?? "Não informado."}</Detail>
          {processing.guidance && <Detail label="Como resolver">{processing.guidance}</Detail>}
        </dl>
      )}
    </AppModal>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
