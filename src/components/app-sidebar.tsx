import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  FileText,
  FileCheck2,
  Database,
  BookMarked,
  HelpCircle,
  CircleUser,
  LogOut,
  Moon,
  Sun,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CURRENT_USER } from "@/lib/current-user";
import { RenderProfiler } from "@/lib/render-profiler";
import { useTheme } from "@/lib/theme";
import brandLogo from "@/assets/haisfaturamento-logo.png.asset.json";
import brandLogoDark from "@/assets/haisfaturamento-logo-dark.png.asset.json";
import brandMark from "@/assets/haisfaturamento-mark.svg.asset.json";

/** Marca oficial do produto: logo HaisFaturamento (variante clara/escura). */
function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={`block min-w-0 ${className ?? ""}`}>
      <img
        src={brandLogo.url}
        alt="HaisFaturamento"
        className="h-6 w-auto max-w-full object-contain dark:hidden"
      />
      <img
        src={brandLogoDark.url}
        alt="HaisFaturamento"
        className="hidden h-6 w-auto max-w-full object-contain dark:block"
      />
    </span>
  );
}

/** Símbolo isolado da marca, usado no sidebar recolhido. */
function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={brandMark.url}
      alt="HaisFaturamento"
      className={`h-6 w-6 shrink-0 object-contain ${className ?? ""}`}
    />
  );
}

export type ItemKey =
  "inicio" | "contratos" | "base-precificacao" | "tuss" | "analise-faturamento" | "design-system" | "icones";

export function AppSidebar({ activeKey }: { activeKey: ItemKey }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Bloqueia o scroll do fundo enquanto o menu mobile estiver aberto.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <RenderProfiler id="AppSidebar">
      <TooltipProvider delayDuration={150}>
        {/* Mobile: barra fixa com o menu em gaveta. */}
        <div className="md:hidden">
          <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
            <button /* ds-allow: controle de navegação do sidebar */
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              className="-ml-1 grid size-9 shrink-0 place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <BrandLogo />
          </header>

          {mobileOpen && (
            <div className="fixed inset-0 z-50">
              <button /* ds-allow: overlay de fechamento do drawer */
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
                className="absolute inset-0 bg-foreground/50"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Menu principal"
                className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
              >
                <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-4">
                  <BrandLogo />
                  <button /* ds-allow: fechar drawer do sidebar */
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Fechar menu"
                    className="grid size-9 shrink-0 place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <SidebarNav activeKey={activeKey} onNavigate={() => setMobileOpen(false)} />
                <UserMenu collapsed={false} />
              </div>
            </div>
          )}
        </div>

        <aside
          className={`hidden md:flex shrink-0 flex-col sticky top-0 h-screen max-h-screen self-start border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ${
            collapsed ? "w-16" : "w-72"
          }`}
        >
          <div
            className={`flex min-w-0 items-center gap-2 border-b border-sidebar-border py-5 ${
              collapsed ? "justify-center px-2" : "px-4"
            }`}
          >
            {collapsed ? (
              /* Recolhido: a própria marca expande o menu; no hover o símbolo dá lugar ao ícone de menu. */
              <button /* ds-allow: expandir sidebar pela área da marca */
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Expandir menu"
                aria-expanded={false}
                className="group/brand relative flex min-w-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BrandMark />
                <span className="absolute left-0 top-0 grid size-6 place-items-center rounded-md bg-sidebar text-sidebar-muted opacity-0 transition-opacity group-hover/brand:opacity-100">
                  <PanelLeft className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            ) : (
              <>
                <Link
                  to="/"
                  aria-label="Ir para Início"
                  className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <BrandLogo />
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Recolher menu"
                      aria-expanded={true}
                      onClick={() => setCollapsed(true)}
                      className="shrink-0 text-sidebar-muted hover:text-sidebar-accent-foreground"
                    >
                      <PanelLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Recolher menu</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          <SidebarNav activeKey={activeKey} collapsed={collapsed} />

          <UserMenu collapsed={collapsed} />
        </aside>
      </TooltipProvider>
    </RenderProfiler>
  );
}

function SidebarNav({
  activeKey,
  collapsed = false,
  onNavigate,
}: {
  activeKey: ItemKey;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      <SidebarGroup label="Início" collapsed={collapsed}>
        <SidebarItem
          icon={LayoutGrid}
          label="Início"
          to="/"
          active={activeKey === "inicio"}
          hint="Ponto de partida do produto, com a base de interface já configurada."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </SidebarGroup>

      <SidebarGroup label="Faturamento" collapsed={collapsed}>
        <SidebarItem
          icon={FileText}
          label="Contratos"
          to="/contratos"
          active={activeKey === "contratos"}
          hint="Contratos das clínicas e hospitais atendidos, com arquivo original anexado."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={Database}
          label="Base de precificação"
          to="/base-precificacao"
          active={activeKey === "base-precificacao"}
          hint="Versões da base de valores utilizada na análise do faturamento."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={BookMarked}
          label="TUSS"
          to="/tuss"
          active={activeKey === "tuss"}
          hint="Versões da TUSS utilizadas na identificação e classificação dos itens do faturamento."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <SidebarItem
          icon={FileCheck2}
          label="Análise de faturamento"
          to="/analise-faturamento"
          active={activeKey === "analise-faturamento"}
          hint="Análise de arquivos XML TISS para identificar divergências nos valores faturados."
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </SidebarGroup>
    </nav>
  );
}

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { isDark, setTheme } = useTheme();
  const dark = isDark;
  const setDark = (updater: (value: boolean) => boolean) =>
    setTheme(updater(dark) ? "dark" : "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const itemClass = "gap-3 px-4 py-2.5 min-h-11 text-sm";

  const userInitials = CURRENT_USER.name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const confirmLogout = () => {
    setLogoutOpen(false);
    setMenuOpen(false);
    toast.success("Sessão encerrada.");
  };

  const logoutConfirmation = (
    <ConfirmDialog
      open={logoutOpen}
      onOpenChange={setLogoutOpen}
      title="Sair da conta?"
      description="Você será desconectado e os dados não salvos deste formulário podem ser perdidos."
      confirmLabel="Sair da conta"
      onConfirm={confirmLogout}
    />
  );

  const content = (
    <DropdownMenuContent
      side="top"
      align="start"
      sideOffset={8}
      className="w-72 p-0 overflow-hidden"
    >
      <DropdownMenuLabel className="px-4 py-3 font-normal">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{CURRENT_USER.name}</div>
            <div className="text-xs text-muted-foreground break-all">{CURRENT_USER.email}</div>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="mx-0 my-0" />

      <DropdownMenuGroup className="py-2">
        {/* Preferência rápida: mantém o menu aberto ao alternar. */}
        <DropdownMenuItem
          className={itemClass}
          onSelect={(event) => {
            event.preventDefault();
            setDark((value) => !value);
          }}
        >
          {dark ? (
            <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1">Modo escuro</span>
          <Switch checked={dark} tabIndex={-1} aria-hidden="true" className="pointer-events-none" />
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass}>
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          Ajuda
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator className="mx-0 my-0" />

      <DropdownMenuGroup className="py-2">
        <DropdownMenuItem
          className={`${itemClass} text-destructive focus:text-destructive`}
          onSelect={(event) => {
            event.preventDefault();
            setLogoutOpen(true);
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border flex flex-col items-center py-3">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Menu do usuário"
                  className="h-auto w-auto p-1.5"
                >
                  <CircleUser className="h-7 w-7 text-sidebar-muted" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{CURRENT_USER.name}</TooltipContent>
          </Tooltip>
          {content}
        </DropdownMenu>
        {logoutConfirmation}
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border flex items-center">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button /* ds-allow: item de perfil do sidebar */
            type="button"
            className="flex-1 min-w-0 px-4 py-4 flex items-center gap-3 hover:bg-sidebar-accent transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CircleUser className="h-9 w-9 text-sidebar-muted shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{CURRENT_USER.name}</div>
              <div className="text-xs text-sidebar-muted">{CURRENT_USER.role}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        {content}
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Sair"
            onClick={() => setLogoutOpen(true)}
            className="mr-3 shrink-0 text-sidebar-muted hover:text-destructive"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Sair</TooltipContent>
      </Tooltip>

      {logoutConfirmation}
    </div>
  );
}

function SidebarGroup({
  label,
  children,
  collapsed,
}: {
  label: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <div className="px-3 text-xs font-semibold uppercase tracking-wide text-sidebar-muted">
          {label}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  hint,
  to,
  collapsed,
  onNavigate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  hint?: string;
  to?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const className = [
    "group w-full flex items-center gap-3 rounded-md text-sm transition-colors",
    collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  ].join(" ");

  const inner = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center justify-center">
          <Icon className="size-4.5 shrink-0" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  ) : (
    <>
      <Icon className="size-4.5 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {hint && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              aria-label={`Sobre ${label}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 opacity-60 hover:opacity-100 focus:opacity-100 transition-opacity text-sidebar-muted hover:text-sidebar-accent-foreground"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            sideOffset={10}
            collisionPadding={12}
            className="max-w-[min(18rem,calc(100vw-2rem))] whitespace-normal break-words text-xs leading-snug px-3 py-2"
          >
            {hint}
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} onClick={onNavigate}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      /* ds-allow: estilo compartilhado do item de sidebar */ type="button"
      className={className}
    >
      {inner}
    </button>
  );
}
