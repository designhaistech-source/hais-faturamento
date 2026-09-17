import { AlertTriangle, Bell } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState, TableSkeleton } from "@/components/data-state";
import { DsSpecimen, DsSubhead } from "./ds-section";

/** Feedback ao usuário: alertas, progresso, carregamento e estados de dados. */
export function FeedbackSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DsSubhead
          title="Alertas"
          hint="Mensagem persistente no contexto. Para confirmação de ação use toast."
        />
        <div className="grid gap-3 rounded-xl border border-border bg-surface-subtle p-4 lg:grid-cols-2">
          <Alert>
            <Bell className="size-4" />
            <AlertTitle>Guia em análise</AlertTitle>
            <AlertDescription>O retorno da operadora costuma levar até 48 horas.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Falha na importação</AlertTitle>
            <AlertDescription>
              Dois arquivos não puderam ser lidos. Reenvie em formato PDF.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Toast"
          hint="Confirmação curta de uma ação concluída. Sempre via sonner (toast.success/error)."
        />
        <DsSpecimen>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success("Código copiado para a área de transferência.")}
          >
            Toast de sucesso
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.error("Não foi possível salvar o documento.")}
          >
            Toast de erro
          </Button>
        </DsSpecimen>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Progresso e carregamento"
          hint="Progress para etapas mensuráveis; Skeleton para conteúdo que preserva o layout."
        />
        <div className="space-y-4 rounded-xl border border-border bg-surface-subtle p-4">
          <Progress value={64} />
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <TableSkeleton rows={3} columns={4} className="rounded-lg border border-border bg-card" />
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Estados de dados"
          hint="Toda superfície de dados cobre carregando, vazio e erro — sempre com estes componentes."
        />
        <div className="grid gap-3 rounded-xl border border-border bg-surface-subtle p-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card">
            <LoadingState size="sm" title="Carregando guias…" />
          </div>
          <div className="rounded-lg border border-border bg-card">
            <EmptyState
              size="sm"
              title="Nenhum resultado"
              description="Ajuste os filtros ou amplie o período."
            />
          </div>
          <div className="rounded-lg border border-border bg-card">
            <ErrorState size="sm" onRetry={() => toast.info("Recarregando…")} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Identidade"
          hint="Avatar com iniciais quando não há foto — usado na sidebar e em listas de profissionais."
        />
        <DsSpecimen>
          <Avatar>
            <AvatarFallback>MS</AvatarFallback>
          </Avatar>
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">JP</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            Iniciais do nome, no máximo duas letras.
          </span>
        </DsSpecimen>
      </div>
    </div>
  );
}
