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
  "/contratos": { label: "Contratos" },
  "/design-system": { label: "Fundamentos" },
  "/design-system-icones": { label: "Ícones" },
};

/**
 * Trilha de navegação padrão do sistema, derivada da rota atual.
 * Renderiza apenas quando há um nível além da home.
 */
export function AppBreadcrumb({ className }: { className?: string }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const meta = ROUTE_META[normalized];

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
