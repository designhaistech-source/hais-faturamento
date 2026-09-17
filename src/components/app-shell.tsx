import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Estrutura genérica de página do design system HaisTech.
 *
 * Reproduz — sem alterar — o esqueleto já repetido nas telas do HaisFaturamento:
 * navegação lateral à esquerda + `main` rolável com a coluna de conteúdo.
 * A navegação em si (itens, rotas, ícones, marca) é sempre um slot fornecido
 * pelo produto: este componente não conhece rota nem regra de negócio.
 *
 * Novas telas e novos produtos devem usar `AppShell` + `PageContainer`; as
 * telas existentes continuam com o markup próprio até uma migração explícita
 * (ver `docs/design-system-libraries.md`, seção de navegação e layout).
 */

export interface AppShellProps {
  /** Navegação lateral do produto (ex.: `<AppSidebar />`). */
  sidebar?: ReactNode;
  /** Faixa fixa no topo do conteúdo, quando o produto usar header próprio. */
  header?: ReactNode;
  /** Rodapé dentro da área de conteúdo. */
  footer?: ReactNode;
  /** Impede o estouro horizontal do conteúdo (tabelas largas, folhas A4). */
  overflowGuard?: boolean;
  className?: string;
  mainClassName?: string;
  children: ReactNode;
}

export function AppShell({
  sidebar,
  header,
  footer,
  overflowGuard = true,
  className,
  mainClassName,
  children,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen w-full bg-background text-foreground", className)}>
      {sidebar}

      <main
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col",
          overflowGuard && "overflow-x-hidden",
          mainClassName,
        )}
      >
        {header}
        {children}
        {footer}
      </main>
    </div>
  );
}

export interface PageContainerProps {
  /** Espaçamento vertical entre os blocos da página. */
  gap?: "md" | "lg";
  className?: string;
  children: ReactNode;
}

/**
 * Coluna de conteúdo da página: largura total, respiro lateral progressivo e
 * espaço para o gatilho flutuante da navegação em telas estreitas (`pt-20`).
 */
export function PageContainer({ gap = "lg", className, children }: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full min-w-0 flex-1 px-4 py-6 pb-16 pt-20 sm:px-6 sm:py-8 md:pt-8 lg:px-10",
        gap === "lg" ? "space-y-6" : "space-y-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
