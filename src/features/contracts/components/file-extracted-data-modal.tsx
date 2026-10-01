import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSearch } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  contractRuleBaseLabel,
  contractRuleTitle,
  formatContractRuleValidity,
  parseRuleCodes,
  summarizeContractRule,
  type ContractRule,
} from "../data/contract-rules";
import { contractRulesQueryKey, listContractRules } from "../data/contract-rules-service";

export interface ExtractedFileTarget {
  contractId: string;
  /** Nulo para o contrato original. */
  amendmentId: string | null;
  fileName: string;
  status: ReactNode;
  /** Só busca as regras quando a extração foi concluída. */
  available: boolean;
  /** Abre o documento original para conferir o trecho. */
  onViewDocument?: () => void;
}

const NOT_IDENTIFIED = "Não identificado";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percentLabel(value: number): string {
  return `${Math.abs(value).toLocaleString("pt-BR")}%`;
}

/** Campos principais conforme o tipo da regra; só o que a extração guarda. */
function ruleFields(rule: ContractRule): { label: string; value: ReactNode }[] {
  const codes = parseRuleCodes(rule.codes);
  const fields: { label: string; value: ReactNode }[] = [];
  if (codes.length > 0) {
    fields.push({ label: "Código", value: <span className="font-mono">{codes.join(", ")}</span> });
  }
  if (rule.baseType !== "none") {
    fields.push({ label: "Tabela", value: contractRuleBaseLabel(rule.baseType) });
  }
  if (rule.negotiatedValue !== null) {
    fields.push({ label: "Valor", value: brl(rule.negotiatedValue) });
  }
  if (rule.adjustmentPercent !== 0) {
    fields.push({
      label: rule.adjustmentPercent > 0 ? "Acréscimo" : "Desconto",
      value: percentLabel(rule.adjustmentPercent),
    });
  }
  if (rule.factor !== 1)
    fields.push({ label: "Fator", value: rule.factor.toLocaleString("pt-BR") });
  return fields;
}

function ruleConditions(rule: ContractRule): string[] {
  const items: string[] = [];
  const codes = parseRuleCodes(rule.codes);
  if (codes.length > 0) {
    items.push(
      `Aplica-se somente ${codes.length === 1 ? "ao código" : "aos códigos"} ${codes.join(", ")}.`,
    );
  } else if (rule.category.trim()) {
    items.push(`Aplica-se a todos os itens da categoria ${rule.category.trim()}.`);
  }
  const validity = formatContractRuleValidity(rule);
  if (validity) items.push(`Válida para atendimentos no período ${validity}.`);
  return items;
}

function requiredData(rule: ContractRule): string[] {
  const items: string[] = [];
  if (parseRuleCodes(rule.codes).length > 0) items.push("Código do item faturado");
  else if (rule.category.trim()) items.push("Categoria do item faturado");
  if (rule.baseType !== "none" && rule.baseType !== "contract") {
    items.push(`Preço de referência na versão atual da ${contractRuleBaseLabel(rule.baseType)}`);
  }
  items.push("Valor cobrado no faturamento");
  if (rule.validFrom || rule.validTo) items.push("Data do atendimento");
  return items;
}

function rulePending(rule: ContractRule): string[] {
  const items: string[] = [];
  if (rule.baseType === "none") items.push("Tabela de referência não identificada no contrato.");
  if (rule.baseType === "contract" && rule.negotiatedValue === null) {
    items.push("Valor negociado não identificado no contrato.");
  }
  if (!rule.category.trim() && parseRuleCodes(rule.codes).length === 0) {
    items.push("Categoria ou código dos itens abrangidos não identificado.");
  }
  return items;
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Detalhes derivados apenas dos campos que a extração guarda hoje. */
function RuleDetails({ rule }: { rule: ContractRule }) {
  const fields = ruleFields(rule);
  return (
    <div className="space-y-4">
      <DetailSection title="Regra">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">{NOT_IDENTIFIED}</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
            {fields.map((field) => (
              <Field key={field.label} label={field.label} value={field.value} />
            ))}
          </dl>
        )}
      </DetailSection>
      <DetailSection title="Condições">
        <BulletList items={ruleConditions(rule)} empty="Nenhuma condição identificada." />
      </DetailSection>
      <DetailSection title="Dados necessários para verificação">
        <BulletList items={requiredData(rule)} empty={NOT_IDENTIFIED} />
      </DetailSection>
      <DetailSection title="Pendências">
        <BulletList items={rulePending(rule)} empty="Nenhuma pendência identificada." />
      </DetailSection>
    </div>
  );
}

export function FileExtractedDataModal({
  target,
  onOpenChange,
}: {
  target: ExtractedFileTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = target !== null;
  const query = useQuery({
    queryKey: contractRulesQueryKey(target?.contractId ?? "", target?.amendmentId ?? null),
    queryFn: () => listContractRules(target!.contractId, target!.amendmentId),
    enabled: open && target.available,
  });

  const count = !target?.available
    ? "—"
    : query.data
      ? query.data.length.toLocaleString("pt-BR")
      : query.isError
        ? "—"
        : "Carregando...";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title="Dados extraídos"
      description={target?.fileName}
      footer={
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      }
    >
      {target && (
        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="Status da extração" value={target.status} />
            <Field label="Regras identificadas" value={count} />
          </dl>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Regras identificadas</h3>
            {!target.available ? (
              <p className="text-sm text-muted-foreground">
                As regras ficam disponíveis aqui quando a extração deste arquivo estiver concluída.
              </p>
            ) : query.isPending ? (
              <LoadingState title="Carregando regras" />
            ) : query.isError ? (
              <ErrorState
                title="Não foi possível carregar as regras"
                onRetry={() => void query.refetch()}
              />
            ) : query.data.length === 0 ? (
              <EmptyState
                icon={<FileSearch className="size-5" aria-hidden="true" />}
                title="Nenhuma regra disponível"
                description="Não há regras guardadas para este arquivo."
              />
            ) : (
              <Accordion type="single" collapsible className="rounded-xl border border-border">
                {query.data.map((rule) => {
                  const validity = formatContractRuleValidity(rule);
                  return (
                    <AccordionItem
                      key={rule.id}
                      value={rule.id}
                      className="border-b border-border px-4 last:border-b-0"
                    >
                      <AccordionTrigger className="gap-3 py-3 text-left hover:no-underline">
                        <span className="min-w-0 flex-1 space-y-0.5">
                          <span className="block text-sm font-semibold text-foreground">
                            {contractRuleTitle(rule)}
                          </span>
                          <span className="block text-sm font-normal text-muted-foreground">
                            {summarizeContractRule(rule) || NOT_IDENTIFIED}
                          </span>
                          <span className="block text-xs font-normal text-muted-foreground">
                            Vigência: {validity || NOT_IDENTIFIED}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <RuleDetails rule={rule} />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </section>
        </div>
      )}
    </AppModal>
  );
}
