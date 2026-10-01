import { CircleCheck, Clock } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";

import { contractRuleSituationLabel } from "../data/contract-rule-details";
import type { ContractRule } from "../data/contract-rules";

export function RuleSituationBadge({ rule }: { rule: Pick<ContractRule, "reviewed"> }) {
  return (
    <StatusBadge
      tone={rule.reviewed ? "success" : "warning"}
      icon={rule.reviewed ? CircleCheck : Clock}
      label={contractRuleSituationLabel(rule as ContractRule)}
    />
  );
}
