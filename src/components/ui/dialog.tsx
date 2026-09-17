"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Tamanhos padronizados dos modais do sistema.
 * sm  → confirmações e formulários de um campo
 * md  → formulários curtos
 * lg  → listas e formulários longos
 * xl  → conteúdo lado a lado (ex.: detalhes da guia com preview)
 */
const dialogContentVariants = cva(
  "fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-card p-0 shadow-lg duration-200 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-3xl",
        xl: "max-w-6xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface DialogContentProps
  extends
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /** Elemento que recebe o foco ao abrir. Por padrão o foco vai para o próprio modal. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Oculta o botão X (use apenas em fluxos que exigem uma decisão explícita). */
  hideCloseButton?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className,
      children,
      size,
      initialFocusRef,
      hideCloseButton = false,
      onOpenAutoFocus,
      ...props
    },
    ref,
  ) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(dialogContentVariants({ size }), className)}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          // Foco inicial previsível: campo indicado pela tela ou o container do
          // modal (evita focar acidentalmente um botão destrutivo).
          event.preventDefault();
          const target = initialFocusRef?.current ?? (event.currentTarget as HTMLElement);
          target?.focus?.({ preventScroll: true });
        }}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors cursor-pointer hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
          >
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

/** Cabeçalho fixo do modal: título, descrição e espaço reservado para o botão Fechar. */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 flex-col gap-1 border-b border-border px-4 py-4 pr-14 text-left sm:px-6 sm:py-5",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/** Corpo rolável do modal. Todo conteúdo principal deve ficar aqui. */
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5", className)}
    {...props}
  />
);
DialogBody.displayName = "DialogBody";

/** Faixa fixa auxiliar (filtros, busca) entre cabeçalho e corpo. */
const DialogToolbar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("shrink-0 border-b border-border bg-surface-subtle px-4 py-3 sm:px-6", className)}
    {...props}
  />
);
DialogToolbar.displayName = "DialogToolbar";

/** Rodapé fixo: ação secundária à esquerda da primária, empilhadas no mobile. */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-surface-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-display text-base font-semibold leading-tight tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogToolbar,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogContentVariants,
};
