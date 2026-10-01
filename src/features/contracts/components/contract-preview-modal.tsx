import { Download, FileText } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import type { Contract } from "../data/contracts";
import { ContractDocumentViewer } from "./contract-document-viewer";

interface ContractPreviewModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (contract: Contract) => void;
}

/** Pré-visualização do contrato em modal, sem exibir a URL técnica do arquivo. */
export function ContractPreviewModal({
  contract,
  open,
  onOpenChange,
  onDownload,
}: ContractPreviewModalProps) {
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={contract?.file.name ?? "Contrato"}
      description="Pré-visualização do contrato."
      descriptionHidden
      icon={<FileText className="size-5" aria-hidden="true" />}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!contract}
            onClick={() => contract && onDownload(contract)}
          >
            <Download className="size-4" aria-hidden="true" />
            Baixar
          </Button>
        </>
      }
    >
      <ContractDocumentViewer contract={contract} active={open} />
    </AppModal>
  );
}
