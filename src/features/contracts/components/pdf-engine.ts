type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type PdfWorker = InstanceType<PdfjsModule["PDFWorker"]>;

let pdfjsPromise: Promise<PdfjsModule> | null = null;
let workerPromise: Promise<PdfWorker> | null = null;

/** Carrega (uma única vez por sessão) o pdf.js e registra o worker. */
export function loadPdfjs(): Promise<PdfjsModule> {
  pdfjsPromise ??= (async () => {
    const [pdfjs, worker] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    // Deixa o script do worker no cache do navegador antes do primeiro uso.
    void fetch(worker.default).catch(() => undefined);
    return pdfjs;
  })().catch((cause: unknown) => {
    pdfjsPromise = null;
    throw cause;
  });
  return pdfjsPromise;
}

/**
 * Worker único reaproveitado entre aberturas do modal: evita pagar a
 * inicialização do pdf.js a cada pré-visualização.
 */
export function getPdfWorker(): Promise<PdfWorker> {
  workerPromise ??= (async () => {
    const pdfjs = await loadPdfjs();
    const worker = new pdfjs.PDFWorker();
    await worker.promise;
    return worker;
  })().catch((cause: unknown) => {
    workerPromise = null;
    throw cause;
  });
  return workerPromise;
}

/** Aquece o motor de PDF antes de o usuário abrir a pré-visualização. */
export function prefetchPdfEngine(): void {
  void getPdfWorker().catch(() => {
    /* aquecimento opcional: falhas são tratadas ao renderizar */
  });
}
