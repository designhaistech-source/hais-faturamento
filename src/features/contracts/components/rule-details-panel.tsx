import type { ReactNode } from "react";
import { EyeOff, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/surface-card";

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

/** Detalhamento da regra selecionada, exibido na própria página abaixo da tabela. */
export function RuleDetailsPanel({
  rule,
  fileName,
  documentVisible,
  onViewDocument,
  onHideDocument,
}: {
  rule: ContractRule;
  fileName: string;
  documentVisible: boolean;
  onViewDocument: () => void;
  onHideDocument: () => void;
}) {
  const fields = contractRuleFields(rule);
  const pending = contractRulePending(rule);

  return (
    <SurfaceCard padding="md" className="min-w-0 space-y-4">
      <header className="space-y-1 border-b border-border pb-4">
        <h3 className="text-base font-semibold text-foreground">{contractRuleTitle(rule)}</h3>
        <p className="text-sm text-muted-foreground">
          {contractRuleHeadline(rule) || "Não identificado"}
        </p>
      </header>
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
        {documentVisible ? (
          <Button type="button" variant="outline" size="sm" onClick={onHideDocument}>
            <EyeOff className="size-4" aria-hidden="true" />
            Ocultar documento
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={onViewDocument}>
            <FileText className="size-4" aria-hidden="true" />
            Ver no documento
          </Button>
        )}
      </Section>
    </SurfaceCard>
  );
}
