import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import type { Contract } from "../data/contracts";
import { downloadContractBlob } from "../data/contracts-service";

interface ContractPreviewModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (contract: Contract) => void;
}

/** Formatos que o navegador consegue renderizar diretamente. */
function isPreviewable(contract: Contract): boolean {
  const name = contract.file.name.toLowerCase();
  const type = contract.file.type.toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf") || type.startsWith("image/");
}

/** Descobre o MIME correto: o storage pode devolver o blob sem tipo definido. */
function resolveMimeType(contract: Contract, blobType: string): string {
  if (blobType && blobType !== "application/octet-stream") return blobType;
  if (contract.file.type && contract.file.type !== "application/octet-stream") {
    return contract.file.type;
  }
  return contract.file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : blobType;
}

/**
 * Pré-visualização do contrato dentro do produto. O arquivo é carregado do
 * armazenamento como blob local, sem exibir a URL técnica na interface.
 */
export function ContractPreviewModal({
  contract,
  open,
  onOpenChange,
  onDownload,
}: ContractPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const previewable = contract ? isPreviewable(contract) : false;

  useEffect(() => {
    if (!open || !contract || !previewable) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setStatus("loading");

    void downloadContractBlob(contract.file.path)
      .then((blob) => {
        if (cancelled) return;
        const type = resolveMimeType(contract, blob.type);
        // Re-tipar o blob garante que o navegador renderize o PDF em vez de baixá-lo.
        createdUrl = URL.createObjectURL(type ? blob.slice(0, blob.size, type) : blob);
        setMimeType(type);
        setObjectUrl(createdUrl);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      setObjectUrl(null);
      setMimeType("");
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, contract, previewable]);

  const isImage = mimeType.toLowerCase().startsWith("image/");

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
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
      {!previewable ? (
        <EmptyState
          icon={<FileText className="size-10" aria-hidden="true" />}
          title="Visualização não disponível"
          description="Este formato não pode ser pré-visualizado. Baixe o arquivo para abri-lo."
        />
      ) : status === "error" ? (
        <ErrorState
          title="Não foi possível carregar a pré-visualização"
          description="Baixe o arquivo para abri-lo."
        />
      ) : status !== "ready" || !objectUrl ? (
        <LoadingState title="Carregando pré-visualização…" />
      ) : isImage ? (
        <img
          src={objectUrl}
          alt={`Pré-visualização de ${contract?.file.name ?? "contrato"}`}
          className="mx-auto max-h-[70dvh] w-auto rounded-lg border border-border object-contain"
        />
      ) : (
        <iframe
          src={objectUrl}
          title={`Pré-visualização de ${contract?.file.name ?? "contrato"}`}
          className="h-[70dvh] w-full rounded-lg border border-border bg-muted"
        />
      )}
    </AppModal>
  );
}
