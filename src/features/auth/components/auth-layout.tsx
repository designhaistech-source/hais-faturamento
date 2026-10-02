import type { ReactNode } from "react";

import brandLogo from "@/assets/haisfaturamento-logo.png.asset.json";
import brandLogoDark from "@/assets/haisfaturamento-logo-dark.png.asset.json";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Estrutura comum das telas de autenticação: formulário à esquerda e painel de marca à direita. */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh w-full bg-background">
      <section className="flex w-full flex-col bg-card px-6 py-8 sm:px-10 md:w-1/2 lg:w-[45%] lg:px-16">
        <div>
          <img src={brandLogo.url} alt="HaisFaturamento" className="h-8 w-auto dark:hidden" />
          <img src={brandLogoDark.url} alt="HaisFaturamento" className="hidden h-8 w-auto dark:block" />
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">
            <header className="mb-8">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
              {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
            </header>
            {children}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 HaisTech</p>
      </section>

      <BrandPanel />
    </main>
  );
}

/** Composição abstrata inspirada em documentos e dados de faturamento; puramente decorativa. */
function BrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden bg-primary md:block md:w-1/2 lg:w-[55%]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-foreground/40" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(var(--primary-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--primary-foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 size-[28rem] rounded-full bg-primary-foreground/10 blur-3xl" />

      <div className="absolute inset-0 flex items-center justify-center p-12">
        <div className="relative h-80 w-72">
          <div className="absolute left-10 top-6 h-72 w-56 rotate-6 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5" />
          <div className="absolute left-0 top-0 h-72 w-56 -rotate-3 rounded-2xl border border-primary-foreground/30 bg-primary-foreground/10 p-6 backdrop-blur-sm">
            <div className="h-2.5 w-24 rounded-full bg-primary-foreground/50" />
            <div className="mt-3 h-2 w-16 rounded-full bg-primary-foreground/30" />
            <div className="mt-8 space-y-3">
              {[100, 80, 92, 64].map((w) => (
                <div key={w} className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-primary-foreground/60" />
                  <div className="h-2 rounded-full bg-primary-foreground/25" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-10 flex h-16 items-end gap-2">
              {[40, 65, 50, 85, 70, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-primary-foreground/35" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
