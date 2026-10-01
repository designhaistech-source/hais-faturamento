import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { StatusBadge, type StatusTone } from "@/components/status-badge";

import type { AmendmentExtractionStatus } from "../data/contract-amendments-service";

const STATUS_CONFIG = {
  available: { tone: "success", icon: CircleCheck, label: "Concluída" },
  extracting: { tone: "info", icon: LoaderCircle, label: "Extraindo..." },
  not_identified: { tone: "warning", icon: TriangleAlert, label: "Não identificados" },
  failed: { tone: "danger", icon: CircleAlert, label: "Falha na extração" },
} as const satisfies Record<
  AmendmentExtractionStatus,
  { tone: StatusTone; icon: LucideIcon; label: string }
>;

export function AmendmentStatusBadge({ status }: { status: AmendmentExtractionStatus }) {
  const { tone, icon, label } = STATUS_CONFIG[status];
  return <StatusBadge tone={tone} icon={icon} label={label} spinning={status === "extracting"} />;
}
