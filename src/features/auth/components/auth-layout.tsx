import type { ReactNode } from "react";

import { BrandPattern } from "./brand-pattern";
import brandLogoDark from "@/assets/haisfaturamento-logo-dark.png.asset.json";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  showPattern?: boolean;
}

/** Estrutura comum das telas de autenticação: fundo institucional único, mensagem à esquerda e cartão à direita. */
export function AuthLayout({ title, description, children, showPattern = true }: AuthLayoutProps) {
  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-gradient-to-br from-brand-surface-from to-brand-surface-to text-brand-surface-foreground">
      {/* Pattern institucional decorativo: sangra pela borda inferior esquerda, só em telas largas. */}
      {showPattern && (
        <BrandPattern className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden select-none lg:block" />
      )}

      <header className="px-6 pt-8 sm:px-10 lg:px-16">
        <img src={brandLogoDark.url} alt="HaisFaturamento" className="h-8 w-auto" />
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center gap-12 px-4 py-10 sm:px-10 lg:justify-between lg:px-16">
        <section className="hidden max-w-xl lg:block">
          <h2 className="font-display text-5xl font-semibold leading-tight tracking-tight text-brand-surface-foreground">
            Gestão de faturamento hospitalar{" "}
            <span className="text-brand-highlight">mais simples.</span>
          </h2>
          <p className="mt-6 text-lg text-brand-surface-muted">
            Organize informações, automatize processos e tenha mais eficiência na sua rotina.
          </p>
        </section>

        <div className="mx-auto w-full max-w-[440px] rounded-2xl bg-card p-6 text-card-foreground shadow-lg sm:p-9 lg:mx-0 [&_form]:space-y-5 [&_input]:h-12 [&_input]:text-base [&_label]:text-sm [&_button[type=submit]]:h-12 [&_button[type=submit]]:text-base">
          <header className="mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
          </header>
          {children}
        </div>
      </main>

      <footer className="flex flex-col items-center gap-2 px-6 pb-8 text-xs text-brand-surface-muted sm:flex-row sm:justify-between sm:px-10 lg:px-16">
        <span>© 2026 HaisTech. Todos os direitos reservados.</span>
        <nav aria-label="Links legais" className="flex gap-6">
          {/* TODO: sem URLs reais de Termos e Política ainda; links apontam para âncoras até serem definidos. */}
          <a href="#termos" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Termos de uso
          </a>
          <a href="#privacidade" className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Política de privacidade
          </a>
        </nav>
      </footer>
    </div>
  );
}
