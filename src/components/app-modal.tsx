import type { ReactNode, RefObject } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogToolbar,
  type DialogContentProps,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título do modal (obrigatório para leitores de tela). */
  title: ReactNode;
  /** Texto de apoio abaixo do título. */
  description?: ReactNode;
  /** Mantém a descrição apenas para leitores de tela. */
  descriptionHidden?: boolean;
  /** Ícone exibido à esquerda do título. */
  icon?: ReactNode;
  /** Conteúdo extra dentro do cabeçalho (badges, abas). */
  headerExtra?: ReactNode;
  /** Faixa fixa entre cabeçalho e corpo (filtros, busca). */
  toolbar?: ReactNode;
  /** Ações fixas no rodapé. Omitido quando não há ações. */
  footer?: ReactNode;
  size?: DialogContentProps["size"];
  /** Renderiza o conteúdo sem o corpo rolável padrão. */
  unstyledBody?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  toolbarClassName?: string;
  footerClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  hideCloseButton?: boolean;
  role?: DialogContentProps["role"];
  children?: ReactNode;
}

/**
 * Wrapper padrão dos modais do sistema: cabeçalho (ícone + título + descrição),
 * corpo rolável, faixa de filtros opcional e rodapé de ações — com os mesmos
 * paddings e tamanhos em todas as telas.
 */
export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  descriptionHidden = false,
  icon,
  headerExtra,
  toolbar,
  footer,
  size = "md",
  unstyledBody = false,
  className,
  headerClassName,
  bodyClassName,
  toolbarClassName,
  footerClassName,
  initialFocusRef,
  hideCloseButton,
  role,
  children,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size={size}
        className={className}
        initialFocusRef={initialFocusRef}
        hideCloseButton={hideCloseButton}
        {...(role ? { role } : {})}
      >
        <DialogHeader className={headerClassName}>
          <div className="flex items-center gap-2">
            {icon && <span className="shrink-0 text-primary">{icon}</span>}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className={descriptionHidden ? "sr-only" : undefined}>
              {description}
            </DialogDescription>
          )}
          {headerExtra}
        </DialogHeader>

        {toolbar && <DialogToolbar className={toolbarClassName}>{toolbar}</DialogToolbar>}

        {unstyledBody ? (
          children
        ) : (
          <DialogBody className={cn(bodyClassName)}>{children}</DialogBody>
        )}

        {footer && <DialogFooter className={footerClassName}>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
