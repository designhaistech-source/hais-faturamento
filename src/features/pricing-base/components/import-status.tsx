import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Ban,
  CircleCheck,
  CircleX,
  FileWarning,
  Files,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { IMPORT_STATUS_LABEL, type ImportStatus } from "../data/pricing-import";
import {
  formatVersionDateTime,
  hasBrowsableDetails,
  lastUpdateAt,
  pricingBaseTypeLabel,
  type PricingVersion,
} from "../data/pricing-versions";

const STATUS_VISUAL: Record<ImportStatus, { tone: StatusTone; icon: LucideIcon }> = {
  COMPLETED: { tone: "success", icon: CircleCheck },
  COMPLETED_WITH_ERRORS: { tone: "warning", icon: TriangleAlert },
  NOT_SUPPORTED: { tone: "neutral", icon: Ban },
  INVALID_FORMAT: { tone: "danger", icon: FileWarning },
  FAILED: { tone: "danger", icon: CircleX },
};

/** Resultado da importação (informativo, não clicável). */
export function ImportStatusBadge({ status }: { status: ImportStatus | null }) {
  if (status === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const visual = STATUS_VISUAL[status];
  return <StatusBadge tone={visual.tone} icon={visual.icon} label={IMPORT_STATUS_LABEL[status]} />;
}

const BLOCKING_TITLE: Partial<Record<ImportStatus, string>> = {
  FAILED: "A importação falhou",
  NOT_SUPPORTED: "Arquivo não suportado",
  INVALID_FORMAT: "Formato inválido",
};

/** Versões antigas gravaram o status no início do motivo; o título do callout já o comunica. */
export function importReason(problem: string | null): string {
  if (!problem) return "Motivo não informado.";
  return problem
    .replace(/^((?:[^:]+: )?)Layout não suportado: c/, "$1C")
    .replace(/^((?:[^:]+: )?)Layout SIMPRO não reconhecido\. /, "$1");
}

/** "arquivo.csv · linha 3" em versões com vários arquivos; só o número caso contrário. */
export function lineLabel(line: number, file: string | undefined): string {
  return file ? `${file} · linha ${line}` : String(line);
}

type CalloutTone = "warning" | "neutral" | "danger";

const CALLOUT_ICON: Record<CalloutTone, LucideIcon> = {
  warning: TriangleAlert,
  neutral: Ban,
  danger: CircleX,
};

/** Callout único dos resultados da importação: fundo tonal, borda sutil, ícone, título e descrição. */
export function ImportCallout({
  tone,
  title,
  children,
}: {
  tone: CalloutTone;
  title?: string;
  children: ReactNode;
}) {
  const Icon = CALLOUT_ICON[tone];
  return (
    <Alert variant={tone}>
      <Icon className="size-4" aria-hidden="true" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="text-muted-foreground">{children}</AlertDescription>
    </Alert>
  );
}

function count(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toLocaleString("pt-BR");
}

/** Lista de pares rótulo/valor usada no resumo e no cabeçalho da página de detalhes. */
export function SummaryList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-0.5">
          <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
          <dd className="break-words text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface ImportSummaryModalProps {
  version: PricingVersion | null;
  onOpenChange: (open: boolean) => void;
}

/** Visão resumida da importação; o detalhamento completo fica na página dedicada. */
export function ImportSummaryModal({ version, onOpenChange }: ImportSummaryModalProps) {
  const browsable = version !== null && hasBrowsableDetails(version);
  return (
    <AppModal
      open={version !== null}
      onOpenChange={onOpenChange}
      title="Resumo da importação"
      description={
        version
          ? version.files.length > 1
            ? `${version.file.name} +${version.files.length - 1} ${version.files.length === 2 ? "arquivo" : "arquivos"}`
            : version.file.name
          : undefined
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {browsable && version && (
            <Button asChild>
              <Link to="/base-precificacao/$versionId" params={{ versionId: version.id }}>
                <Files className="size-4" aria-hidden="true" />
                Ver detalhes da importação
              </Link>
            </Button>
          )}
        </>
      }
    >
      {version && <ImportSummaryBody version={version} />}
    </AppModal>
  );
}

function ImportSummaryBody({ version }: { version: PricingVersion }) {
  if (version.importStatus === null) {
    return (
      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Detalhes da importação indisponíveis</AlertTitle>
        <AlertDescription>
          Esta versão foi cadastrada antes da disponibilização do detalhamento das importações.
        </AlertDescription>
      </Alert>
    );
  }

  const status = version.importStatus;
  const updatedAt = lastUpdateAt(version);
  const items: Array<{ label: string; value: ReactNode }> = [
    { label: "Status", value: <ImportStatusBadge status={status} /> },
    { label: "Tipo da base", value: pricingBaseTypeLabel(version.baseType) },
    { label: "Quantidade de arquivos", value: count(version.files.length) },
  ];
  if (status === "COMPLETED" || status === "COMPLETED_WITH_ERRORS") {
    items.push({ label: "Registros importados", value: count(version.processedCount) });
  }
  if (status === "COMPLETED_WITH_ERRORS") {
    items.push({
      label: "Registros com erros",
      value: count(version.errorCount ?? version.errorRows.length),
    });
  }
  items.push(
    { label: "Cadastrado por", value: version.createdBy },
    { label: "Data do cadastro", value: formatVersionDateTime(version.createdAt) },
  );
  if (updatedAt) {
    items.push({ label: "Última atualização", value: formatVersionDateTime(updatedAt) });
  }

  return (
    <div className="space-y-5">
      {status === "NOT_SUPPORTED" && (
        <ImportCallout tone="neutral" title={BLOCKING_TITLE.NOT_SUPPORTED}>
          {importReason(version.importProblem)}
        </ImportCallout>
      )}
      {(status === "INVALID_FORMAT" || status === "FAILED") && (
        <ImportCallout tone="danger" title={BLOCKING_TITLE[status]}>
          {importReason(version.importProblem)}
        </ImportCallout>
      )}
      {status === "COMPLETED_WITH_ERRORS" && (
        <ImportCallout tone="warning" title="Base processada com erros">
          Por isso, esta versão não substituiu a versão atual de{" "}
          {pricingBaseTypeLabel(version.baseType)}.
        </ImportCallout>
      )}
      <SummaryList items={items} />
    </div>
  );
}
