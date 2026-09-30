import {
  CircleAlert,
  CircleCheck,
  FileSearch,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/status-badge";

import { contractRulesStatusLabel, type ContractRulesDisplayStatus } from "../data/contract-rules";

const CONFIG = {
  available: { tone: "success", icon: CircleCheck },
  extracting: { tone: "info", icon: LoaderCircle },
  not_identified: { tone: "warning", icon: TriangleAlert },
  failed: { tone: "danger", icon: CircleAlert },
  not_extracted: { tone: "neutral", icon: FileSearch },
} as const satisfies Record<ContractRulesDisplayStatus, { tone: StatusTone; icon: LucideIcon }>;

export function ContractRulesStatusBadge({
  status,
}: {
  status: ContractRulesDisplayStatus | null;
}) {
  if (status === null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const { tone, icon } = CONFIG[status];
  return (
    <StatusBadge
      tone={tone}
      icon={icon}
      label={contractRulesStatusLabel(status)}
      spinning={status === "extracting"}
    />
  );
}
