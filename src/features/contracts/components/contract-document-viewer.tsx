import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import type { Contract } from "../data/contracts";
import { downloadContractBlob } from "../data/contracts-service";
import { PdfPreview } from "./pdf-preview";
import { prefetchPdfEngine } from "./pdf-engine";

/** Bytes já convertidos por contrato, reutilizados ao reabrir na mesma sessão. */
const pdfBufferCache = new Map<string, ArrayBuffer>();

/**
 * Localização da evidência no documento. Ainda não é gravada pela extração;
 * quando existir, o visualizador poderá abrir direto no trecho.
 */
export interface DocumentLocation {
  page?: number;
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

function isPreviewable(contract: Contract): boolean {
  return isPdf(contract) || isImage(contract);
}

/**
 * Visualizador de documentos do produto, usado no modal e em painéis da página.
 * PDFs são desenhados em canvas (pdf.js) porque o leitor nativo do navegador
 * não funciona dentro do iframe do preview.
 */
export function ContractDocumentViewer({
  contract,
  active = true,
}: {
  contract: Contract | null;
  active?: boolean;
  location?: DocumentLocation;
}) {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const previewable = contract ? isPreviewable(contract) : false;
  const handleError = useCallback(() => {
    setStatus("error");
  }, []);

  useEffect(() => {
    prefetchPdfEngine();
  }, []);

  useEffect(() => {
    if (!active || !contract || !previewable) {
      setStatus("idle");
      return;
    }

    const path = contract.file.path;
    const cachedBuffer = pdfBufferCache.get(path);
    if (cachedBuffer && !isImage(contract)) {
      setPdfData(cachedBuffer);
      setImageUrl(null);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setStatus("loading");

    void downloadContractBlob(path)
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
          pdfBufferCache.set(path, buffer);
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
  }, [active, contract, previewable]);

  return (
    <>
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
    </>
  );
}
