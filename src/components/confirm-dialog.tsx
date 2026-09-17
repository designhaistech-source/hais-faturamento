import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";

export type ConfirmTone = "destructive" | "warning";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pergunta curta em Sentence case, sempre terminando com "?". */
  title: ReactNode;
  /** Explica a consequência da ação. */
  description: ReactNode;
  /** Rótulo da ação principal (verbo no infinitivo). */
  confirmLabel: string;
  onConfirm: () => void;
  /** Rótulo da ação de recuo. Padrão: "Cancelar". */
  cancelLabel?: string;
  onCancel?: () => void;
  /** Ação intermediária opcional (variante secundária). */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /**
   * `destructive` para perda de dados (ícone e botão vermelhos);
   * `warning` para decisões reversíveis.
   */
  tone?: ConfirmTone;
}

/**
 * Diálogo único de confirmação/descarte do sistema: ícone de alerta conforme o
 * tom, título em Sentence case, descrição da consequência e rodapé com
 * "Cancelar" (outline) + ação principal (destructive/default), sempre `size="sm"`.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = "Cancelar",
  onCancel,
  secondaryLabel,
  onSecondary,
  tone = "destructive",
}: ConfirmDialogProps) {
  const close = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
        else onOpenChange(true);
      }}
      size="sm"
      role="alertdialog"
      unstyledBody
      icon={
        <AlertTriangle
          className={
            tone === "destructive" ? "size-4 text-destructive" : "size-4 text-warning-strong"
          }
        />
      }
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>
            {cancelLabel}
          </Button>
          {secondaryLabel && onSecondary && (
            <Button variant="secondary" size="sm" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
