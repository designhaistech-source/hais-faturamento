import { CheckCircle2, CircleDashed, Inbox, AlertTriangle } from "lucide-react";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DsGuidance, DsSubhead } from "./ds-section";

export function PatternsSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DsSubhead
          title="Card de seção"
          hint="Bloco padrão de conteúdo: título, descrição e ações à direita."
        />
        <SurfaceCard
          title="Materiais solicitados"
          description="Adicione os itens que serão enviados à operadora."
          actions={
            <Button size="sm" variant="secondary">
              Adicionar material
            </Button>
          }
          padding="lg"
        >
          <p className="text-sm text-muted-foreground">Conteúdo da seção.</p>
        </SurfaceCard>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Barra de ação"
          hint="Pills de status do preenchimento seguidos da ação principal."
        />
        <SurfaceCard padding="md">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex items-center icon-optical gap-1.5 rounded-full border border-success/30 bg-success-muted/50 px-2.5 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="size-3.5" /> Paciente
              </span>
              <span className="inline-flex items-center icon-optical gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <CircleDashed className="size-3.5" /> Materiais
              </span>
            </div>
            <Button size="sm" className="shrink-0">
              Enviar solicitação
            </Button>
          </div>
        </SurfaceCard>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Estados de dados"
          hint="Toda lista ou tabela cobre carregando, vazio e erro — nunca tela em branco."
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Carregando
            </p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-6 text-center">
            <Inbox className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Nenhuma guia processada</p>
            <p className="text-xs text-muted-foreground">Importe um arquivo para começar.</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm font-medium text-foreground">Erro ao carregar</p>
            <Button size="sm" variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Tabela"
          hint="Cabeçalho em maiúsculas discretas, status como badge suave."
        />
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-subtle">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Guia</th>
                <th className="px-4 py-2.5">Beneficiário</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">10023481</td>
                <td className="px-4 py-2.5 text-foreground">Maria Souza</td>
                <td className="px-4 py-2.5">
                  <Badge variant="success-soft">Autorizada</Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">10023482</td>
                <td className="px-4 py-2.5 text-foreground">João Lima</td>
                <td className="px-4 py-2.5">
                  <Badge variant="warning-soft">Pendente</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <DsGuidance
        dos={[
          "Usar tokens semânticos (bg-primary, text-muted-foreground)",
          "Um card por assunto, com título e descrição curtos",
          "Textos de interface em PT-BR, no infinitivo para ações",
          "Ícones lucide-react com tamanho 16px em botões",
        ]}
        donts={[
          "Cores fixas como text-white, bg-black ou hexadecimais",
          "Mais de uma ação primária na mesma tela",
          "Tabela ou lista sem estado de carregando/vazio/erro",
          "Criar variações de card ou botão fora deste guia",
        ]}
      />
    </div>
  );
}
