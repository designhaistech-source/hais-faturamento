import { Plus, Send, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { StatusPill } from "@/components/status-pill";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { DsSpecimen, DsSubhead } from "./ds-section";

export function ComponentsSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DsSubhead
          title="Botões"
          hint="Uma única ação primária por tela. Ícone sempre à esquerda do texto."
        />
        <DsSpecimen>
          <Button size="sm">
            <Send /> Enviar solicitação
          </Button>
          <Button size="sm" variant="secondary">
            <Plus /> Adicionar material
          </Button>
          <Button size="sm" variant="outline">
            Cancelar
          </Button>
          <Button size="sm" variant="ghost">
            Limpar
          </Button>
          <Button size="sm" variant="destructive">
            <Trash2 /> Remover
          </Button>
          <Button size="sm" disabled>
            Desabilitado
          </Button>
        </DsSpecimen>
      </div>

      <div className="space-y-3">
        <DsSubhead title="Badges e status" hint="Sólidos para ênfase, suaves dentro de tabelas." />
        <DsSpecimen>
          <Badge>Padrão</Badge>
          <Badge variant="success">Autorizada</Badge>
          <Badge variant="warning">Em análise</Badge>
          <Badge variant="destructive">Glosada</Badge>
          <Badge variant="info">Enviada</Badge>
          <Badge variant="purple">Controlada</Badge>
          <Badge variant="primary-soft">Em processamento</Badge>
          <Badge variant="success-soft">Processada</Badge>
          <Badge variant="warning-soft">Pendente</Badge>
          <Badge variant="destructive-soft">Erro</Badge>
          <Badge variant="outline">Rascunho</Badge>
        </DsSpecimen>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Chips e pills de progresso"
          hint="Chip para filtros e atalhos selecionáveis; StatusPill para etapas da barra de ação."
        />
        <DsSpecimen>
          <Chip>Últimos 7 dias</Chip>
          <Chip variant="selected">Ortopedia</Chip>
          <Chip variant="soft">3 itens</Chip>
          <Chip variant="warning">Favoritos</Chip>
          <Chip asSpan variant="outline">
            Competência: 07/2026
          </Chip>
          <StatusPill done label="Paciente" />
          <StatusPill done={false} label="Medicamentos" />
        </DsSpecimen>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Campos de formulário"
          hint="Sempre via componente Field: rótulo, indicador de obrigatoriedade e mensagem."
        />
        <div className="grid gap-4 rounded-xl border border-border bg-surface-subtle p-4 lg:grid-cols-3">
          <Field id="ds-nome" label="Nome do beneficiário" required>
            <Input placeholder="Maria Souza" />
          </Field>
          <Field id="ds-operadora" label="Operadora" required>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="humanas">Humanas</SelectItem>
                <SelectItem value="unimed">Unimed Natal/RN</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            id="ds-busca"
            label="Buscar material"
            optional
            hint="Busque por nome ou código TUSS"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Placa bloqueada" />
            </div>
          </Field>
          <Field
            id="ds-cartao"
            label="Cartão do beneficiário"
            error="Informe um número válido com 15 dígitos."
          >
            <Input defaultValue="0000 0000" aria-invalid />
          </Field>
          <Field id="ds-just" label="Justificativa clínica" required className="lg:col-span-2">
            <Textarea rows={3} placeholder="Descreva o quadro clínico e a indicação." />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Seleção"
          hint="Checkbox para múltipla escolha, switch para preferências."
        />
        <DsSpecimen>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox defaultChecked /> Guia com anexo
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox /> Caráter de urgência
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Switch /> Notificar por e-mail
          </label>
        </DsSpecimen>
      </div>
    </div>
  );
}
