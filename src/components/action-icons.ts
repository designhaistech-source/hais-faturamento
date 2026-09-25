import { Download, Eye, FileSearch } from "lucide-react";

/**
 * Semântica única dos ícones da coluna AÇÕES: o ícone representa o tipo de ação,
 * nunca o status do registro (status é comunicado pelos badges).
 * CircleAlert não é ação — só aparece em badges, alertas e callouts.
 */
export const ActionIcon = {
  /** Visualizar o arquivo/documento original enviado pelo usuário. */
  viewOriginal: Eye,
  /** Consultar o que o sistema produziu ao processar um arquivo (sucesso ou falha). */
  inspectProcessing: FileSearch,
  /** Baixar arquivo(s). */
  download: Download,
} as const;
