import { describe, expect, it } from "vitest";

import type { ContractRule } from "@/features/contracts/data/contract-rules";
import type {
  PricingBaseType,
  PricingVersion,
} from "@/features/pricing-base/data/pricing-versions";

import { analyzeBilling } from "./analysis-engine";
import { parsePricingCsv, type PricingBaseLookup } from "./pricing-lookup";
import { readTissItems, readTissItemsDetailed } from "./tiss-xml";

/** Dados sintéticos de teste; não representam contratos reais. */
function rule(patch: Partial<ContractRule>): ContractRule {
  return {
    id: crypto.randomUUID(),
    contractId: "c1",
    reviewed: true,
    category: "",
    baseType: "none",
    codes: "",
    factor: 1,
    adjustmentPercent: 0,
    negotiatedValue: null,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    sourceExcerpt: "",
    ...patch,
  };
}

function base(type: PricingBaseType, csv: string): [PricingBaseType, PricingBaseLookup] {
  const version = { file: { name: `${type}.csv` } } as unknown as PricingVersion;
  return [type, { version, values: parsePricingCsv(csv) }];
}

const XML = `<?xml version="1.0"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:procedimentosExecutados>
    <ans:procedimentoExecutado>
      <ans:dataExecucao>2026-03-10</ans:dataExecucao>
      <ans:procedimento><ans:codigoTabela>22</ans:codigoTabela><ans:codigoProcedimento>P1</ans:codigoProcedimento><ans:descricaoProcedimento>Proc</ans:descricaoProcedimento></ans:procedimento>
      <ans:quantidadeExecutada>1</ans:quantidadeExecutada><ans:valorUnitario>280.00</ans:valorUnitario><ans:valorTotal>280.00</ans:valorTotal>
    </ans:procedimentoExecutado>
    <ans:procedimentoExecutado>
      <ans:dataExecucao>2026-03-10</ans:dataExecucao>
      <ans:procedimento><ans:codigoTabela>98</ans:codigoTabela><ans:codigoProcedimento>PK1</ans:codigoProcedimento></ans:procedimento>
      <ans:quantidadeExecutada>1</ans:quantidadeExecutada><ans:valorTotal>850.00</ans:valorTotal>
    </ans:procedimentoExecutado>
  </ans:procedimentosExecutados>
  <ans:outrasDespesas>
    <ans:despesa><ans:codigoDespesa>02</ans:codigoDespesa><ans:servicosExecutados><ans:dataExecucao>2026-03-10</ans:dataExecucao><ans:codigoTabela>20</ans:codigoTabela><ans:codigoProcedimento>M1</ans:codigoProcedimento><ans:quantidadeExecutada>1</ans:quantidadeExecutada><ans:valorTotal>100.00</ans:valorTotal></ans:servicosExecutados></ans:despesa>
    <ans:despesa><ans:codigoDespesa>03</ans:codigoDespesa><ans:servicosExecutados><ans:dataExecucao>2026-03-10</ans:dataExecucao><ans:codigoTabela>19</ans:codigoTabela><ans:codigoProcedimento>X1</ans:codigoProcedimento><ans:quantidadeExecutada>1</ans:quantidadeExecutada><ans:valorTotal>180.00</ans:valorTotal></ans:servicosExecutados></ans:despesa>
  </ans:outrasDespesas>
</ans:mensagemTISS>`;

describe("analyzeBilling", () => {
  const rules = [
    rule({ category: "Medicamentos", baseType: "brasindice", adjustmentPercent: -15 }),
    rule({ category: "Materiais", baseType: "simpro", adjustmentPercent: -10 }),
    rule({ category: "Honorários e procedimentos", baseType: "cbhpm" }),
    rule({ category: "Pacote", baseType: "contract", codes: "PK1", negotiatedValue: 850 }),
  ];
  const bases = new Map([
    base("brasindice", "Código,Valor\nM1,100.0"),
    base("simpro", "Código,Valor\nX1,200.0"),
    base("cbhpm", "Código,Valor\nP1,300.0"),
  ]);

  it("classifica cada item com a regra e a base corretas", () => {
    const doc = new DOMParser().parseFromString(XML, "application/xml");
    const result = analyzeBilling(readTissItems(doc), rules, bases);
    const byCode = Object.fromEntries(result.items.map((item) => [item.code, item]));

    expect(byCode.M1).toMatchObject({ status: "divergent", expectedValue: 85, difference: 15 });
    expect(byCode.X1).toMatchObject({ status: "ok", expectedValue: 180, difference: 0 });
    expect(byCode.P1).toMatchObject({ status: "divergent", expectedValue: 300, difference: -20 });
    expect(byCode.PK1).toMatchObject({
      status: "ok",
      expectedValue: 850,
      referenceType: "contract",
    });
    expect(result.totals).toMatchObject({ itemCount: 4, divergenceCount: 2, unanalyzedCount: 0 });
  });

  it("registra motivo quando a regra está fora da vigência ou o código não existe", () => {
    const items = [
      {
        lineNumber: 1,
        code: "M1",
        description: "",
        quantity: 1,
        unitValue: 100,
        totalValue: 100,
        executedAt: "2027-02-01",
        category: "medicamentos",
      },
      {
        lineNumber: 2,
        code: "M9",
        description: "",
        quantity: 1,
        unitValue: 10,
        totalValue: 10,
        executedAt: "2026-02-01",
        category: "medicamentos",
      },
    ];
    const result = analyzeBilling(items, rules, bases);
    expect(result.items[0]).toMatchObject({ status: "unanalyzed", expectedValue: null });
    expect(result.items[0].reason).toContain("vigência");
    expect(result.items[1].reason).toContain("Código não encontrado");
  });

  it("usa outra regra vigente quando a base da categoria não contém o código", () => {
    const items = [
      {
        lineNumber: 1,
        code: "M1",
        description: "",
        quantity: 1,
        unitValue: 100,
        totalValue: 100,
        executedAt: "2026-03-10",
        category: "procedimentos",
      },
    ];
    const result = analyzeBilling(items, rules, bases);
    expect(result.items[0]).toMatchObject({
      status: "divergent",
      expectedValue: 85,
      referenceType: "brasindice",
      category: "procedimentos",
    });
  });

  it("marca ambiguidade quando o código existe em mais de uma base aplicável", () => {
    const ambiguous = new Map([
      base("brasindice", "Código,Valor\nZ1,10"),
      base("simpro", "Código,Valor\nZ1,20"),
      base("cbhpm", "Código,Valor\nP1,300"),
    ]);
    const items = [
      {
        lineNumber: 1,
        code: "Z1",
        description: "",
        quantity: 1,
        unitValue: 10,
        totalValue: 10,
        executedAt: "2026-03-10",
        category: "procedimentos",
      },
    ];
    const result = analyzeBilling(items, rules, ambiguous);
    expect(result.items[0].status).toBe("unanalyzed");
    expect(result.items[0].reason).toContain("ambígua");
  });

  it("código fora da base gera item Não analisado sem tornar a extração parcial", () => {
    const xml = XML.replace("<ans:codigoProcedimento>M1<", "<ans:codigoProcedimento>M404<");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const { items, skipped } = readTissItemsDetailed(doc);
    expect(skipped).toHaveLength(0);
    const result = analyzeBilling(items, rules, bases);
    expect(result.items.find((item) => item.code === "M404")?.status).toBe("unanalyzed");
  });

  it("somente trecho não suportado torna a extração parcial", () => {
    const xml = XML.replace(
      "</ans:outrasDespesas>",
      "<ans:despesa><ans:observacao>formato desconhecido</ans:observacao></ans:despesa></ans:outrasDespesas>",
    );
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const { items, skipped } = readTissItemsDetailed(doc);
    expect(items).toHaveLength(4);
    expect(skipped).toHaveLength(1);
  });
});
