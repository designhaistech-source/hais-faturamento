import { useEffect, useRef, useState } from "react";

import { LoadingState } from "@/components/data-state";

interface PdfPreviewProps {
  /** Bytes completos do PDF já recuperados do armazenamento. */
  data: ArrayBuffer;
  onError: () => void;
}

/**
 * Renderiza o PDF em canvas com pdf.js (build legacy, compatível com mais
 * navegadores). Diferente de iframe/object, essa abordagem não depende do
 * leitor nativo do navegador, bloqueado dentro de iframes com sandbox.
 */
export function PdfPreview({ data, onError }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setRendering(true);

    const render = async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      // pdf.js consome (e neutraliza) o buffer recebido: usar uma cópia.
      const pdf = await pdfjs.getDocument({ data: data.slice(0) }).promise;
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;
      container.replaceChildren();

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const width = container.clientWidth || 800;
        const scale = Math.min(2, Math.max(1, width / baseViewport.width));
        const viewport = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });

        const canvas = window.document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = "mx-auto w-full rounded-lg border border-border bg-card";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `Página ${String(pageNumber)} do contrato`);

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas indisponível");

        container.append(canvas);
        await page.render({ canvasContext: context, viewport }).promise;
        if (cancelled) return;
      }

      setRendering(false);
    };

    void render().catch(() => {
      if (!cancelled) onError();
    });

    return () => {
      cancelled = true;
    };
  }, [data, onError]);

  return (
    <div className="max-h-[70dvh] overflow-y-auto rounded-lg bg-muted p-3">
      {rendering ? <LoadingState title="Carregando pré-visualização…" /> : null}
      <div ref={containerRef} className="flex flex-col gap-3" />
    </div>
  );
}
