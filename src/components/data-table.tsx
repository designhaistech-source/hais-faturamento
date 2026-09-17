import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wrappers finos sobre <table> nativa para manter a mesma hierarquia visual
 * (cabeçalho muted, hover, bordas horizontais, padding tabular) em todas as
 * listagens do sistema.
 */

export function DataTable({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}

export function DataTableRoot({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-sm", className)} {...props} />;
}

export function DataTableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function DataTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-muted/40", className)} {...props} />;
}

export function DataTableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-4 py-3 text-left font-medium first:pl-6 last:pr-6", className)}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 align-middle text-foreground first:pl-6 last:pr-6", className)}
      {...props}
    />
  );
}

interface EmptyRowProps {
  colSpan: number;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableEmptyRow({ colSpan, children, className }: EmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn("p-0", className)}>
        {children}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Fallback mobile em cards                                            */
/* ------------------------------------------------------------------ */

/**
 * Em telas estreitas, tabelas viram cartões empilhados (sem rolagem
 * horizontal). Estes primitivos concentram esse layout para que todas as
 * listagens compartilhem a mesma estrutura, espaçamento e tipografia.
 */

type Breakpoint = "md" | "lg";

const HIDE_FROM: Record<Breakpoint, string> = {
  md: "md:hidden",
  lg: "lg:hidden",
};

const SHOW_FROM: Record<Breakpoint, string> = {
  md: "hidden md:block",
  lg: "hidden lg:block",
};

interface CardListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** A partir deste breakpoint a tabela substitui os cartões. */
  breakpoint?: Breakpoint;
  /** Cartões separados por borda (listas densas) em vez de espaçados. */
  divided?: boolean;
}

export function DataTableCardList({
  className,
  breakpoint = "lg",
  divided = false,
  ...props
}: CardListProps) {
  return (
    <ul
      className={cn(
        HIDE_FROM[breakpoint],
        divided ? "divide-y divide-border" : "space-y-3",
        className,
      )}
      {...props}
    />
  );
}

interface CardProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Usa o estilo denso (sem borda própria), para listas com `divided`. */
  flat?: boolean;
}

export function DataTableCard({ className, flat = false, ...props }: CardProps) {
  return (
    <li
      className={cn(
        "space-y-3",
        flat ? "px-4 py-3" : "rounded-xl border border-border bg-card p-4",
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  /** Conteúdo principal (nome do arquivo, código do procedimento...). */
  title: React.ReactNode;
  /** Linha secundária opcional. */
  subtitle?: React.ReactNode;
  /** Badge/status alinhado à direita. */
  trailing?: React.ReactNode;
  className?: string;
}

export function DataTableCardHeader({ title, subtitle, trailing, className }: CardHeaderProps) {
  return (
    <div className={cn("flex min-w-0 items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">{title}</div>
        {subtitle ? (
          <p className="mt-0.5 text-sm break-words text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

export interface DataTableCardField {
  /** Rótulo da coluna equivalente na tabela. */
  label: string;
  value: React.ReactNode;
  /** Mantém o rótulo apenas para leitores de tela. */
  hideLabel?: boolean;
}

interface CardFieldsProps {
  fields: DataTableCardField[];
  /** Número de colunas do grid (padrão 2). */
  columns?: 1 | 2;
  className?: string;
}

export function DataTableCardFields({ fields, columns = 2, className }: CardFieldsProps) {
  return (
    <dl
      className={cn(
        "grid gap-2 text-xs text-muted-foreground",
        columns === 2 ? "grid-cols-1 min-[380px]:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <dt className={field.hideLabel ? "sr-only" : "font-medium"}>{field.label}</dt>
          <dd className={cn("min-w-0 break-words", !field.hideLabel && "mt-0.5")}>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DataTableCardActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between gap-3", className)} {...props} />;
}

interface DesktopProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A partir deste breakpoint a tabela aparece. */
  breakpoint?: Breakpoint;
}

/** Container da tabela, visível só a partir do breakpoint informado. */
export function DataTableDesktop({ className, breakpoint = "lg", ...props }: DesktopProps) {
  return (
    <div className={cn(SHOW_FROM[breakpoint], "w-full overflow-x-auto", className)} {...props} />
  );
}
