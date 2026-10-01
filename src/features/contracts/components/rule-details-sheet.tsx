import type { ReactNode } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import {
  contractRuleApplication,
  contractRuleFields,
  contractRuleHeadline,
  contractRulePending,
  contractRuleRequiredData,
  contractRuleValidity,
} from "../data/contract-rule-details";
import { contractRuleTitle, type ContractRule } from "../data/contract-rules";
import { RuleSituationBadge } from "./rule-situation-badge";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Painel lateral com o detalhamento de uma regra; a página continua como contexto. */
export function RuleDetailsSheet({
  rule,
  fileName,
  onOpenChange,
  onViewDocument,
}: {
  rule: ContractRule | null;
  fileName: string;
  onOpenChange: (open: boolean) => void;
  onViewDocument: () => void;
}) {
  const fields = rule ? contractRuleFields(rule) : [];
  const pending = rule ? contractRulePending(rule) : [];

  return (
    <Sheet open={rule !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {rule && (
          <>
            <SheetHeader className="border-b border-border p-6 pr-12 text-left">
              <SheetTitle>{contractRuleTitle(rule)}</SheetTitle>
              <SheetDescription>{contractRuleHeadline(rule) || "Não identificado"}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <Section title="Resumo">
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Não identificado</p>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {fields.map((field) => (
                      <div key={field.label} className="min-w-0 space-y-0.5">
                        <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
                        <dd
                          className={`break-words text-sm text-foreground ${field.mono ? "font-mono" : ""}`}
                        >
                          {field.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Section>
              <Section title="Aplicação">
                <p className="text-sm text-foreground">{contractRuleApplication(rule)}</p>
              </Section>
              <Section title="Vigência">
                <p className="text-sm text-foreground">{contractRuleValidity(rule)}</p>
              </Section>
              <Section title="Dados necessários">
                <BulletList items={contractRuleRequiredData(rule)} />
              </Section>
              <Section title="Situação">
                <RuleSituationBadge rule={rule} />
                {pending.length > 0 ? (
                  <BulletList items={pending} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma pendência identificada.</p>
                )}
              </Section>
              <Section title="Fonte">
                <p className="text-sm text-foreground">{fileName}</p>
                {rule.sourceExcerpt.trim() ? (
                  <blockquote className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    “{rule.sourceExcerpt.trim()}”
                  </blockquote>
                ) : (
                  <p className="text-sm text-muted-foreground">Trecho não identificado.</p>
                )}
                <Button type="button" variant="outline" size="sm" onClick={onViewDocument}>
                  <FileText className="size-4" aria-hidden="true" />
                  Ver no documento
                </Button>
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
