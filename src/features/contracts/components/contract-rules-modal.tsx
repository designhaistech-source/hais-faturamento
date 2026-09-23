import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Scale, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppModal } from "@/components/app-modal";
import { Field, SelectField, type SelectOption } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState } from "@/components/data-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { extractContractRules } from "@/lib/contract-rules.functions";

import type { Contract } from "../data/contracts";
import {
  CONTRACT_RULE_BASES,
  contractRuleBaseLabel,
  emptyContractRuleDraft,
  toContractRuleBase,
  type ContractRuleDraft,
} from "../data/contract-rules";
import {
  contractRulesQueryKey,
  contractRulesStatusQueryKey,
  listContractRules,
  saveContractRules,
} from "../data/contract-rules-service";
import { readContractText } from "../data/contract-text";

const BASE_OPTIONS: SelectOption[] = CONTRACT_RULE_BASES.map((base) => ({
  value: base,
  label: contractRuleBaseLabel(base),
}));

interface ContractRulesModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseDecimal(value: string, fallback: number): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Regras de remuneração do contrato: leitura automática do arquivo, revisão
 * pelo usuário e gravação para uso nas análises de faturamento.
 */
export function ContractRulesModal({ contract, open, onOpenChange }: ContractRulesModalProps) {
  const queryClient = useQueryClient();
  const contractId = contract?.id ?? "";

  const rulesQuery = useQuery({
    queryKey: contractRulesQueryKey(contractId),
    queryFn: () => listContractRules(contractId),
    enabled: open && contractId !== "",
  });

  const [rules, setRules] = useState<ContractRuleDraft[]>([]);
  const [confirmReextract, setConfirmReextract] = useState(false);
  const hasRules = rules.length > 0;

  useEffect(() => {
    if (!open) return;
    if (!rulesQuery.data) return;
    setRules(
      rulesQuery.data.map(
        ({ id: _id, contractId: _contractId, reviewed: _reviewed, ...draft }) => draft,
      ),
    );
  }, [open, rulesQuery.data]);

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error("Contrato não selecionado.");
      const contractText = await readContractText(contract);
      if (contractText.length < 40) {
        throw new Error("Não foi possível ler o texto do arquivo do contrato.");
      }
      const extracted = await extractContractRules({ data: { contractText } });
      const drafts: ContractRuleDraft[] = extracted.map((rule) => ({
        category: rule.category,
        baseType: toContractRuleBase(rule.baseType),
        codes: rule.codes,
        factor: Number.isFinite(rule.factor) ? rule.factor : 1,
        adjustmentPercent: Number.isFinite(rule.adjustmentPercent) ? rule.adjustmentPercent : 0,
        negotiatedValue: rule.negotiatedValue,
        validFrom: rule.validFrom,
        validTo: rule.validTo,
        sourceExcerpt: rule.sourceExcerpt,
      }));
      /** Regras extraídas ficam salvas como revisão pendente até a confirmação. */
      if (drafts.length > 0) await saveContractRules(contractId, drafts, { reviewed: false });
      return drafts;
    },
    onSuccess: async (drafts) => {
      if (drafts.length === 0) {
        toast.info("Nenhuma regra de remuneração foi identificada no contrato.");
        return;
      }
      setRules(drafts);
      await queryClient.invalidateQueries({ queryKey: contractRulesStatusQueryKey });
      toast.success("Regras identificadas. Revise antes de salvar.");
    },
    onError: (cause: unknown) => {
      toast.error(
        cause instanceof Error ? cause.message : "Não foi possível ler as regras do contrato.",
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => saveContractRules(contractId, rules),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contractRulesQueryKey(contractId) });
      await queryClient.invalidateQueries({ queryKey: contractRulesStatusQueryKey });
      toast.success("Regras do contrato salvas.");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Não foi possível salvar as regras do contrato.");
    },
  });

  function updateRule(index: number, patch: Partial<ContractRuleDraft>) {
    setRules((previous) =>
      previous.map((rule, position) => (position === index ? { ...rule, ...patch } : rule)),
    );
  }

  return (
    <>
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Regras de remuneração"
      description={
        contract
          ? `Confira as regras usadas nas análises do contrato de ${contract.company}.`
          : "Confira as regras usadas nas análises deste contrato."
      }
      icon={<Scale className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {hasRules && (
            <Button
              type="button"
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Salvar e concluir revisão
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {hasRules && (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {`${rules.length} ${rules.length === 1 ? "regra identificada" : "regras identificadas"}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Revise as informações extraídas do contrato antes de utilizá-las nas análises de
                faturamento.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={extractMutation.isPending || !contract}
              onClick={() => setConfirmReextract(true)}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {extractMutation.isPending ? "Lendo o contrato…" : "Extrair novamente"}
            </Button>
          </div>
        )}


        {rulesQuery.isPending && open ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : rulesQuery.isError ? (
          <ErrorState
            title="Não foi possível carregar as regras"
            description="Tente novamente em alguns instantes."
            onRetry={() => void rulesQuery.refetch()}
          />
        ) : !hasRules ? (
          <EmptyState
            icon={<Scale className="size-10" aria-hidden="true" />}
            title="Nenhuma regra de remuneração identificada"
            description="Use a IA para identificar as regras presentes no contrato ou adicione uma regra manualmente."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={extractMutation.isPending || !contract}
                  onClick={() => extractMutation.mutate()}
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  {extractMutation.isPending ? "Lendo o contrato…" : "Ler regras do contrato"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRules((previous) => [...previous, emptyContractRuleDraft()])}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Adicionar regra manualmente
                </Button>
              </div>
            }
          />
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-border bg-muted/40 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`rule-category-${index}`} label="Categoria de cobrança">
                    <Input
                      value={rule.category}
                      placeholder="Ex.: medicamentos"
                      onChange={(event) => updateRule(index, { category: event.target.value })}
                    />
                  </Field>
                  <SelectField
                    id={`rule-base-${index}`}
                    label="Referência"
                    value={rule.baseType}
                    options={BASE_OPTIONS}
                    triggerClassName="[&>span]:leading-normal [&>span]:line-clamp-none"
                    onValueChange={(value) =>
                      updateRule(index, { baseType: toContractRuleBase(value) })
                    }
                  />
                  <Field
                    id={`rule-codes-${index}`}
                    label="Códigos específicos"
                    hint="Separados por vírgula; vazio aplica a toda a categoria."
                  >
                    <Input
                      value={rule.codes}
                      onChange={(event) => updateRule(index, { codes: event.target.value })}
                    />
                  </Field>
                  <Field id={`rule-factor-${index}`} label="Fator">
                    <Input
                      inputMode="decimal"
                      value={String(rule.factor)}
                      onChange={(event) =>
                        updateRule(index, { factor: parseDecimal(event.target.value, 1) })
                      }
                    />
                  </Field>
                  <Field
                    id={`rule-adjustment-${index}`}
                    label="Desconto ou acréscimo (%)"
                    hint="Desconto com sinal negativo."
                  >
                    <Input
                      inputMode="decimal"
                      value={String(rule.adjustmentPercent)}
                      onChange={(event) =>
                        updateRule(index, {
                          adjustmentPercent: parseDecimal(event.target.value, 0),
                        })
                      }
                    />
                  </Field>
                  <Field id={`rule-negotiated-${index}`} label="Valor negociado (R$)">
                    <Input
                      inputMode="decimal"
                      value={rule.negotiatedValue === null ? "" : String(rule.negotiatedValue)}
                      onChange={(event) =>
                        updateRule(index, {
                          negotiatedValue:
                            event.target.value.trim() === ""
                              ? null
                              : parseDecimal(event.target.value, 0),
                        })
                      }
                    />
                  </Field>
                  <Field id={`rule-valid-from-${index}`} label="Vigência de">
                    <Input
                      type="date"
                      value={rule.validFrom}
                      onChange={(event) => updateRule(index, { validFrom: event.target.value })}
                    />
                  </Field>
                  <Field id={`rule-valid-to-${index}`} label="Vigência até">
                    <Input
                      type="date"
                      value={rule.validTo}
                      onChange={(event) => updateRule(index, { validTo: event.target.value })}
                    />
                  </Field>
                </div>

                <Field
                  id={`rule-excerpt-${index}`}
                  label="Trecho do contrato"
                  hint="Usado apenas para conferência."
                >
                  <Textarea
                    rows={2}
                    value={rule.sourceExcerpt}
                    onChange={(event) => updateRule(index, { sourceExcerpt: event.target.value })}
                  />
                </Field>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      setRules((previous) => previous.filter((_, position) => position !== index))
                    }
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remover regra
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRules((previous) => [...previous, emptyContractRuleDraft()])}
            >
              <Plus className="size-4" aria-hidden="true" />
              Adicionar regra
            </Button>
          </div>
        )}
      </div>
    </AppModal>

    <ConfirmDialog
      open={confirmReextract}
      onOpenChange={setConfirmReextract}
      tone="warning"
      title="Extrair as regras novamente?"
      description="As regras atuais serão substituídas pelas regras identificadas no contrato, e as alterações já revisadas serão perdidas."
      confirmLabel="Extrair novamente"
      onConfirm={() => {
        setConfirmReextract(false);
        extractMutation.mutate();
      }}
    />
    </>
  );
}
