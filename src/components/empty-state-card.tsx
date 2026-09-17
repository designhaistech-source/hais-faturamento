import type { ReactNode } from "react";

import { EmptyState } from "@/components/data-state";
import { SurfaceCard } from "@/components/surface-card";

interface EmptyStateCardProps {
  /** Ícone grande do estado vazio; use um ícone `lucide-react` com `size-10`. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Ação primária, normalmente o botão de criação do recurso. */
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vazio padrão das telas: card com borda e cantos arredondados,
 * conteúdo centralizado vertical e horizontalmente.
 * Use sempre este componente quando uma listagem não tem nenhum registro.
 */
export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateCardProps) {
  return (
    <SurfaceCard padding="md" className={className}>
      <EmptyState
        size="lg"
        className="py-8"
        icon={icon}
        title={title}
        description={description}
        action={action}
      />
    </SurfaceCard>
  );
}
