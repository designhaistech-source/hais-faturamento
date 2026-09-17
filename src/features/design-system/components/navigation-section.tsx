import * as React from "react";
import { FileText, Stethoscope, CalendarCheck, MoreHorizontal, Info } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Combobox, MultiSelect } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/form-field";
import { DsSpecimen, DsSubhead } from "./ds-section";

const CID_OPTIONS = [
  { value: "M17.0", label: "M17.0 — Gonartrose primária bilateral" },
  { value: "S72.0", label: "S72.0 — Fratura do colo do fêmur" },
  { value: "I10", label: "I10 — Hipertensão essencial" },
];

const ESPECIALIDADES = [
  { value: "orto", label: "Ortopedia" },
  { value: "cardio", label: "Cardiologia" },
  { value: "clinica", label: "Clínica médica" },
];

/** Navegação, seleção avançada e sobreposições. */
export function NavigationSection() {
  const [cid, setCid] = React.useState("M17.0");
  const [especialidades, setEspecialidades] = React.useState(ESPECIALIDADES.map((o) => o.value));
  const [tipo, setTipo] = React.useState("comum");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DsSubhead
          title="Tabs"
          hint="Divide um mesmo contexto em visões irmãs (Relatórios, Atestados, Comparecimento). Nunca use para navegar entre páginas."
        />
        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <Tabs defaultValue="relatorios">
            <TabsList>
              <TabsTrigger value="relatorios">
                <FileText /> Relatórios
              </TabsTrigger>
              <TabsTrigger value="atestados">
                <Stethoscope /> Atestados
              </TabsTrigger>
              <TabsTrigger value="comparecimento">
                <CalendarCheck /> Comparecimento
              </TabsTrigger>
            </TabsList>
            <TabsContent value="relatorios" className="pt-4 text-sm text-muted-foreground">
              Conteúdo da aba Relatórios.
            </TabsContent>
            <TabsContent value="atestados" className="pt-4 text-sm text-muted-foreground">
              Conteúdo da aba Atestados.
            </TabsContent>
            <TabsContent value="comparecimento" className="pt-4 text-sm text-muted-foreground">
              Conteúdo da aba Comparecimento.
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Busca e seleção avançada"
          hint="Combobox para listas longas com busca; MultiSelect quando o padrão é 'todos' selecionados."
        />
        <div className="grid gap-4 rounded-xl border border-border bg-surface-subtle p-4 lg:grid-cols-2">
          <Field id="ds-cid" label="CID-10" hint="Busca por código ou descrição">
            <Combobox
              id="ds-cid"
              options={CID_OPTIONS}
              value={cid}
              onChange={setCid}
              placeholder="Selecione o CID"
              clearable
            />
          </Field>
          <Field id="ds-esp" label="Especialidades" optional>
            <MultiSelect
              id="ds-esp"
              options={ESPECIALIDADES}
              values={especialidades}
              onChange={setEspecialidades}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Escolha única"
          hint="RadioGroup quando as opções mudam o fluxo (tipo de receita); Select/Combobox quando são apenas dados."
        />
        <DsSpecimen>
          <RadioGroup value={tipo} onValueChange={setTipo} className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <RadioGroupItem value="comum" /> Receita comum
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <RadioGroupItem value="especial" /> Receita especial
            </label>
          </RadioGroup>
        </DsSpecimen>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Seções colapsáveis"
          hint="Accordion para formulários longos: mantenha aberta apenas a etapa em foco."
        />
        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <Accordion type="single" collapsible defaultValue="paciente">
            <AccordionItem value="paciente">
              <AccordionTrigger>Paciente e convênio</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Dados de identificação e elegibilidade.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="profissional">
              <AccordionTrigger>Profissional solicitante</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Nome, conselho e especialidade.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead
          title="Sobreposições"
          hint="Dialog com layout fixo (header/body/footer), menu de ações secundárias e tooltip curto."
        />
        <DsSpecimen>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Abrir modal
              </Button>
            </DialogTrigger>
            <DialogContent size="md">
              <DialogHeader>
                <DialogTitle>Confirmar emissão</DialogTitle>
                <DialogDescription>
                  A guia será enviada à operadora e não poderá ser editada.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="text-sm text-muted-foreground">
                Revise os procedimentos antes de confirmar.
              </DialogBody>
              <DialogFooter>
                <Button size="sm" variant="outline">
                  Cancelar
                </Button>
                <Button size="sm">Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreHorizontal /> Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Guia 000123</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
              <DropdownMenuItem>Baixar PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Info /> Ajuda
                </Button>
              </TooltipTrigger>
              <TooltipContent>Texto curto, sem ações dentro.</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-8" />
          <span className="text-xs text-muted-foreground">
            Separator para dividir grupos de ação.
          </span>
        </DsSpecimen>
      </div>
    </div>
  );
}
