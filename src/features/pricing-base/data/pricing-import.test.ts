import { describe, expect, it } from "vitest";

import { parsePricingImport, parsePricingImportSet, simulateImportResult } from "./pricing-import";

describe("parsePricingImport", () => {
  it("accepts any content as COMPLETED without domain validation", () => {
    const result = parsePricingImport("medicamento;tiss;preco\nDipirona;123;12,5X\nqualquer coisa");
    expect(result.status).toBe("COMPLETED");
    expect(result.records).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(parsePricingImport("linha solta sem separador\n0001 texto").status).toBe("COMPLETED");
  });

  it("merges several files into one COMPLETED result", () => {
    const result = parsePricingImportSet([
      { name: "a.txt", content: "cab\nx\ny" },
      { name: "b.txt", content: "cab\nz" },
    ]);
    expect(result.status).toBe("COMPLETED");
    expect(result.records.map((record) => record.file)).toEqual(["a.txt", "a.txt", "b.txt"]);
  });

  it("only produces other statuses through the temporary simulation", () => {
    const base = parsePricingImport("cab\nx\ny");
    const withErrors = simulateImportResult(base, "COMPLETED_WITH_ERRORS");
    expect(withErrors.status).toBe("COMPLETED_WITH_ERRORS");
    expect(withErrors.errors).toHaveLength(1);
    expect(simulateImportResult(base, "FAILED").problem).toContain("Simulação temporária");
  });
});
