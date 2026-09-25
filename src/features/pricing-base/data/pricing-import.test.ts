import { describe, expect, it } from "vitest";

import { parsePricingImport } from "./pricing-import";

const HEADER = "medicamento;tiss;tuss;ean;preco";

describe("parsePricingImport", () => {
  it("imports valid Brasíndice rows as COMPLETED", () => {
    const result = parsePricingImport(
      `${HEADER}\nDipirona;9000000301;90000001;7890000000011;12,50\nAmoxicilina;9000000302;;;8.90`,
    );
    expect(result.status).toBe("COMPLETED");
    expect(result.records).toHaveLength(2);
    expect(result.fields).toEqual(["description", "tiss", "tuss", "ean", "price"]);
  });

  it("reports line errors as COMPLETED_WITH_ERRORS", () => {
    const result = parsePricingImport(
      [
        HEADER,
        "A;9000000301;90000001;;10,00",
        "B;9000000302;;;12,5X",
        "C;900000030;;;1,00",
        "D;;;;1,00",
        "E;9000000301;;;1,00",
        "F;9000000303;;78900000A0011;1,00",
        "G;9000000304;4031103;;1,00",
      ].join("\n"),
    );
    expect(result.status).toBe("COMPLETED_WITH_ERRORS");
    expect(result.errors.map((error) => error.reason)).toEqual([
      'Valor inválido "12,5X" no campo preço.',
      'O código TISS "900000030" precisa ter 10 dígitos.',
      "O código TISS está vazio.",
      "O código TISS 9000000301 já apareceu na linha 2.",
      'Valor inválido "78900000A0011" no campo EAN.',
      'Valor inválido "4031103" no campo TUSS.',
    ]);
    expect(result.totalLines).toBe(7);
  });

  it("flags unknown layouts as NOT_SUPPORTED and empty files as INVALID_FORMAT", () => {
    expect(parsePricingImport("nome;quantidade\nx;1").status).toBe("NOT_SUPPORTED");
    expect(parsePricingImport("").status).toBe("INVALID_FORMAT");
    expect(parsePricingImport(`${HEADER}\n`).status).toBe("INVALID_FORMAT");
  });
});
