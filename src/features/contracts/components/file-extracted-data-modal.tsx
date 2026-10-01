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
}

const NOT_IDENTIFIED = "Não identificado";

function brDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : NOT_IDENTIFIED;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function effectOf(rule: ContractRule): string[] {
  const items: string[] = [];
  if (rule.adjustmentPercent !== 0) {
    const sign = rule.adjustmentPercent > 0 ? "Acréscimo" : "Desconto";
    items.push(`${sign} de ${Math.abs(rule.adjustmentPercent).toLocaleString("pt-BR")}%`);
  }
  if (rule.factor !== 1) items.push(`Fator ${rule.factor.toLocaleString("pt-BR")}`);
  if (rule.negotiatedValue !== null) {
    items.push(
      `Valor negociado ${rule.negotiatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    );
  }
  return items;
}

/**
 * Exibe apenas os campos que a extração atual produz; seções do escopo
 * solicitado sem dado correspondente na extração não são exibidas.
 */
function RuleDetails({ rule, fileName }: { rule: ContractRule; fileName: string }) {
  const codes = parseRuleCodes(rule.codes);
  const effect = effectOf(rule);
  return (
    <div className="space-y-4">
      <Section title="Vigência">
        <Field
          label="Início da eficácia"
          value={rule.validFrom ? brDate(rule.validFrom) : NOT_IDENTIFIED}
        />
        <Field
          label="Fim da eficácia"
          value={rule.validTo ? brDate(rule.validTo) : NOT_IDENTIFIED}
        />
      </Section>
      <Section title="Alvo">
        <Field
          label="Código"
          value={
            codes.length > 0 ? (
              <span className="font-mono">{codes.join(", ")}</span>
            ) : (
              NOT_IDENTIFIED
            )
          }
        />
        <Field
          label="Sistema/tabela"
          value={rule.baseType === "none" ? NOT_IDENTIFIED : contractRuleBaseLabel(rule.baseType)}
        />
        <Field label="Categoria" value={rule.category.trim() || NOT_IDENTIFIED} />
      </Section>
      <Section title="Condição e efeito">
        <Field
          label="Efeito identificado"
          value={effect.length > 0 ? effect.join(" · ") : NOT_IDENTIFIED}
        />
      </Section>
      <Section title="Evidências">
        <Field label="Documento" value={fileName} />
        <div className="sm:col-span-2">
          <Field
            label="Trecho"
            value={
              rule.sourceExcerpt.trim() ? (
                <span className="text-muted-foreground">“{rule.sourceExcerpt.trim()}”</span>
              ) : (
                NOT_IDENTIFIED
              )
            }
          />
        </div>
      </Section>
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
      size="lg"
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
            <Field label="Quantidade de regras identificadas" value={count} />
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
              <Accordion type="multiple" className="rounded-xl border border-border">
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
                            {rule.baseType !== "none" &&
                              ` · ${contractRuleBaseLabel(rule.baseType)}`}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <RuleDetails rule={rule} fileName={target.fileName} />
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
