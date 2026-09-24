import { useMemo, useState } from "react";
import { ArrowLeft, FileX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AppModal } from "@/components/app-modal";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/data-state";

import type { BillingAnalysis } from "../data/billing-analyses";
import { getAnalysisXml } from "../data/billing-analyses-service";
import { formatCurrency, formatDecimal } from "../data/analysis-details";
import { buildXmlPreview, downloadXml, formatXml } from "../data/xml-preview";

export const analysisXmlQueryKey = (id: string) => ["billing-analysis-xml", id] as const;

interface XmlPreviewModalProps {
  analysis: BillingAnalysis | null;
  onClose: () => void;
}

/** Pré-visualização legível do XML TISS original de uma análise. */
export function XmlPreviewModal({ analysis, onClose }: XmlPreviewModalProps) {
  const [showRaw, setShowRaw] = useState(false);
  const query = useQuery({
    queryKey: analysisXmlQueryKey(analysis?.id ?? ""),
    queryFn: () => getAnalysisXml(analysis?.id ?? ""),
    enabled: analysis !== null,
  });
  const xml = query.data ?? null;

  const preview = useMemo(() => {
    if (!xml) return null;
    try {
      return buildXmlPreview(xml);
    } catch {
      return null;
    }
  }, [xml]);
  const raw = useMemo(() => (xml && showRaw ? formatXml(xml) : ""), [xml, showRaw]);

  const close = () => {
    setShowRaw(false);
    onClose();
  };

  return (
    <AppModal
      open={analysis !== null}
      onOpenChange={(open) => !open && close()}
      title={
        showRaw ? (
          <span className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-ml-2 size-8"
              aria-label="Voltar para a pré-visualização"
              onClick={() => setShowRaw(false)}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>
            XML original
          </span>
        ) : (
          "Visualizar XML"
        )
      }
      description={analysis?.fileName}
      size="lg"
      footer={
        <>
          {xml && !showRaw && (
            <Button type="button" variant="outline" onClick={() => setShowRaw(true)}>
              Ver XML original
            </Button>
          )}
          <Button type="button" variant="outline" onClick={close}>
            Fechar
          </Button>
        </>
      }
    >
      {query.isPending ? (
        <LoadingState title="Carregando XML" />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar o XML"
          description="Tente novamente em alguns instantes."
          onRetry={() => void query.refetch()}
        />
      ) : !xml ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FileX className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">XML original indisponível</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Esta análise foi realizada antes do armazenamento dos arquivos XML.
          </p>
        </div>
      ) : showRaw ? (
        <pre className="max-h-[60vh] overflow-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs text-foreground">
          {raw}
        </pre>
      ) : !preview ? (
        <ErrorState
          title="Não foi possível interpretar o XML"
          description="Use Ver XML original para conferir o conteúdo do arquivo."
        />
      ) : (
        <div className="space-y-5">
          <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
            {(
              [
                ["Prestador", preview.provider],
                ["CNPJ do prestador", preview.providerCnpj],
                ["Operadora", preview.healthPlan],
                ["Registro ANS", preview.ansCode],
                ["Lote", preview.batch],
                ["Guia", preview.guide],
                ["Data/competência", preview.date],
              ] as const
            )
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="break-words text-foreground">{value}</dd>
                </div>
              ))}
          </dl>

          <section aria-labelledby="xml-items-title" className="space-y-2">
            <h3 id="xml-items-title" className="text-sm font-semibold text-foreground">
              {preview.items.length} {preview.items.length === 1 ? "item" : "itens"} no XML
            </h3>
            {preview.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item faturado encontrado.</p>
            ) : (
              <ul className="max-h-[45vh] divide-y divide-border overflow-auto rounded-xl border border-border">
                {preview.items.map((item) => (
                  <li
                    key={item.lineNumber}
                    className="flex items-start justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.code || "Sem código"}
                      </p>
                      <p className="break-words text-sm text-foreground">
                        {item.description || "Sem descrição"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm text-foreground">
                        {formatCurrency(item.totalValue)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        Qtd. {formatDecimal(item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppModal>
  );
}

export { downloadXml };
