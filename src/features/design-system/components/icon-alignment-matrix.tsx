import type { ReactNode } from "react";
import { Check, Download, Filter, Plus, Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

/**
 * Fixture determinística de regressão visual: matriz de Button, Badge e Chip
 * com ícone à esquerda, à direita e sozinho, em todos os tamanhos.
 * Sem dados dinâmicos, datas ou animações — o screenshot só muda quando o
 * alinhamento/tipografia dos componentes muda.
 */

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-border py-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-4">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const buttonSizes = ["sm", "default", "lg"] as const;
const buttonVariants = ["default", "secondary", "outline", "ghost", "destructive"] as const;

export function IconAlignmentMatrix() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8" data-testid="icon-matrix">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Matriz de alinhamento ícone/texto
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Baseline de regressão visual para Button, Badge e Chip em todos os tamanhos.
        </p>
      </header>

      <Block title="Button — tamanhos">
        {buttonSizes.map((size) => (
          <Row key={size} label={`size="${size}"`}>
            <Button size={size}>
              <Plus />
              Ícone à esquerda
            </Button>
            <Button size={size} variant="outline">
              Ícone à direita
              <Download />
            </Button>
            <Button size={size} variant="secondary">
              Sem ícone
            </Button>
          </Row>
        ))}
        <Row label='size="icon"'>
          <Button size="icon" aria-label="Fechar">
            <X />
          </Button>
          <Button size="icon" variant="outline" aria-label="Filtrar">
            <Filter />
          </Button>
        </Row>
      </Block>

      <Block title="Button — variantes">
        <Row label="com ícone">
          {buttonVariants.map((variant) => (
            <Button key={variant} variant={variant}>
              <Check />
              {variant}
            </Button>
          ))}
        </Row>
      </Block>

      <Block title="Badge — tamanhos">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Row key={size} label={`size="${size}"`}>
            <Badge size={size}>
              <Check />
              Concluído
            </Badge>
            <Badge size={size} variant="warning-soft">
              <Star />
              Especial
            </Badge>
            <Badge size={size} variant="outline">
              Sem ícone
            </Badge>
            <Badge size={size} variant="info-soft">
              Texto mais longo de exemplo
              <Download />
            </Badge>
          </Row>
        ))}
      </Block>

      <Block title="Chip — tamanhos">
        {(["sm", "md"] as const).map((size) => (
          <Row key={size} label={`size="${size}"`}>
            <Chip size={size} asSpan>
              <Filter />
              Filtro
            </Chip>
            <Chip size={size} variant="selected" asSpan>
              <Check />
              Selecionado
            </Chip>
            <Chip size={size} variant="soft" asSpan>
              Sem ícone
            </Chip>
            <Chip size={size} variant="outline" asSpan>
              Remover
              <X />
            </Chip>
          </Row>
        ))}
      </Block>

      <Block title="Escala tipográfica no contêiner">
        {(["text-xs", "text-sm", "text-base"] as const).map((cls) => (
          <div key={cls} className={cls}>
            <Row label={cls}>
              <Button size="sm">
                <Plus />
                Botão
              </Button>
              <Badge size="md">
                <Check />
                Badge
              </Badge>
              <Chip size="md" asSpan>
                <Filter />
                Chip
              </Chip>
            </Row>
          </div>
        ))}
      </Block>
    </div>
  );
}
