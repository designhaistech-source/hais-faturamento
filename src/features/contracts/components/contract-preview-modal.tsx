import { useCallback, useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import type { Contract } from "../data/contracts";
import { downloadContractBlob } from "../data/contracts-service";
import { PdfPreview } from "./pdf-preview";

interface ContractPreviewModalProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (contract: Contract) => void;
}

function isPdf(contract: Contract): boolean {
  return (
    contract.file.type.toLowerCase() === "application/pdf" ||
    contract.file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImage(contract: Contract): boolean {
  return contract.file.type.toLowerCase().startsWith("image/");
}

/** Formatos que o produto consegue pré-visualizar. */
function isPreviewable(contract: Contract): boolean {
  return isPdf(contract) || isImage(contract);
}

/**
 * Pré-visualização do contrato dentro do produto. O arquivo é carregado do
 * armazenamento como blob local, sem exibir a URL técnica na interface.
 * PDFs são desenhados em canvas (pdf.js) porque o leitor nativo do navegador
 * não funciona dentro do iframe do preview.
 */
export function ContractPreviewModal({
  contract,
  open,
  onOpenChange,
  onDownload,
}: ContractPreviewModalProps) {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const previewable = contract ? isPreviewable(contract) : false;
  const handleError = useCallback(() => {
    setStatus("error");
  }, []);

  useEffect(() => {
    if (!open || !contract || !previewable) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setStatus("loading");

    void downloadContractBlob(contract.file.path)
      .then(async (blob) => {
        if (cancelled) return;
        if (isImage(contract)) {
          createdUrl = URL.createObjectURL(blob);
          setImageUrl(createdUrl);
          setPdfData(null);
        } else {
          const buffer = await blob.arrayBuffer();
          if (cancelled) return;
          if (buffer.byteLength === 0) throw new Error("Arquivo vazio");
          setPdfData(buffer);
          setImageUrl(null);
        }
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      setPdfData(null);
      setImageUrl(null);
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [open, contract, previewable]);

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
          title="Não foi possível exibir a pré-visualização"
          description="Baixe o arquivo para abri-lo."
        />
      ) : status !== "ready" ? (
        <LoadingState title="Carregando pré-visualização…" />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={`Pré-visualização de ${contract?.file.name ?? "contrato"}`}
          className="mx-auto max-h-[70dvh] w-auto rounded-lg border border-border object-contain"
          onError={handleError}
        />
      ) : pdfData ? (
        <PdfPreview data={pdfData} onError={handleError} />
      ) : (
        <LoadingState title="Carregando pré-visualização…" />
      )}
    </AppModal>
  );
}
