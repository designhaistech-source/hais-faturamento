type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/** Carrega (uma única vez por sessão) o pdf.js e registra o worker. */
export function loadPdfjs(): Promise<PdfjsModule> {
  pdfjsPromise ??= (async () => {
    const [pdfjs, worker] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  })().catch((cause: unknown) => {
    pdfjsPromise = null;
    throw cause;
  });
  return pdfjsPromise;
}

/** Aquece o motor de PDF antes de o usuário abrir a pré-visualização. */
export function prefetchPdfEngine(): void {
  void loadPdfjs().catch(() => {
    /* aquecimento opcional: falhas são tratadas ao renderizar */
  });
}
