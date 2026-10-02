import type { ReactNode } from "react";

import brandLogo from "@/assets/haisfaturamento-logo.png.asset.json";
import brandLogoDark from "@/assets/haisfaturamento-logo-dark.png.asset.json";

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Estrutura comum das telas de autenticação: card centralizado com a marca no topo. */
export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex justify-center">
          <img src={brandLogo.url} alt="HaisFaturamento" className="h-8 w-auto dark:hidden" />
          <img src={brandLogoDark.url} alt="HaisFaturamento" className="hidden h-8 w-auto dark:block" />
        </div>
        <header className="mb-6 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}
