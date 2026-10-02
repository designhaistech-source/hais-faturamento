import { Link, useRouterState } from "@tanstack/react-router";
import { Home } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface RouteMeta {
  label: string;
}

/** Mapa de rotas para rótulos de trilha, alinhado aos itens da sidebar. */
const ROUTE_META: Record<string, RouteMeta> = {
  "/": { label: "Início" },
  "/contratos": { label: "Operadoras" },
  "/base-precificacao": { label: "Base de precificação" },
  "/tuss": { label: "TUSS" },
  "/analise-faturamento": { label: "Análise de faturamento" },
  "/design-system": { label: "Fundamentos" },
  "/design-system-icones": { label: "Ícones" },
};

/**
 * Trilha de navegação padrão do sistema, derivada da rota atual.
 * Renderiza apenas quando há um nível além da home.
 */
export function AppBreadcrumb({
  className,
  currentLabel,
  parent,
}: {
  className?: string;
  /** Nível intermediário da relação contratual (ex.: página da operadora). */
  parent?: { label: string; contractId: string };
  /** Substitui o rótulo do último nível (ex.: nome da operadora). */
  currentLabel?: string;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  // Página de detalhe: Início > Análise de faturamento > Detalhes da análise.
  const isAnalysisDetail = normalized.startsWith("/analise-faturamento/");
  const isPricingDetail = normalized.startsWith("/base-precificacao/");
  const isContractDetail = normalized.startsWith("/contratos/");
  const routeMeta = isAnalysisDetail
    ? { label: normalized.endsWith("/resultado") ? "Resultado da análise" : "Detalhes da análise" }
    : isPricingDetail
      ? { label: "Detalhes da base" }
      : isContractDetail
        ? {
            label: normalized.includes("/extracao/")
              ? "Detalhes da extração"
              : "Detalhes do contrato",
          }
        : ROUTE_META[normalized];
  const meta = routeMeta && currentLabel ? { label: currentLabel } : routeMeta;

  if (!meta || normalized === "/") return null;

  return (
    <Breadcrumb className={cn("w-full min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap gap-1 sm:flex-wrap sm:gap-1.5">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Home aria-hidden="true" className="size-3.5 shrink-0 icon-optical" />
              {/* Em telas estreitas o ícone já comunica "Início". */}
              <span className="hidden sm:inline">Início</span>
              <span className="sr-only sm:hidden">Início</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="shrink-0" />
        {isAnalysisDetail && (
          <>
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild>
                <Link to="/analise-faturamento" className="transition-colors hover:text-foreground">
                  Análise de faturamento
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="shrink-0" />
          </>
        )}
        {isPricingDetail && (
          <>
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild>
                <Link to="/base-precificacao" className="transition-colors hover:text-foreground">
                  Base de precificação
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="shrink-0" />
          </>
        )}
        {isContractDetail && (
          <>
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild>
                <Link to="/contratos" className="transition-colors hover:text-foreground">
                  Operadoras
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="shrink-0" />
            {parent && (
              <>
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbLink asChild>
                    <Link
                      to="/contratos/$contractId"
                      params={{ contractId: parent.contractId }}
                      className="truncate transition-colors hover:text-foreground"
                    >
                      {parent.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
              </>
            )}
          </>
        )}
        <BreadcrumbItem className="min-w-0 flex-1">
          <BreadcrumbPage
            title={meta.label}
            className="block truncate font-semibold text-foreground sm:whitespace-normal"
          >
            {meta.label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
