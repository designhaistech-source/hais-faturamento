import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BackgroundTaskProvider, useBackgroundTask, type BackgroundTaskOutcome } from "./background-task";

function deferred() {
  let resolve!: (value: BackgroundTaskOutcome) => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<BackgroundTaskOutcome>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const contract = deferred();
const billing = deferred();

function Starter() {
  const tasks = useBackgroundTask();
  return (
    <button
      type="button"
      onClick={() => {
        tasks.start({
          kind: "contract-rules",
          fileName: "contrato.pdf",
          processing: { title: "Analisando contrato", description: "Extraindo..." },
          failure: { title: "Falhou contrato", description: "Erro." },
          run: () => contract.promise,
        });
        tasks.start({
          kind: "billing-analysis",
          fileName: "lote.xml",
          processing: { title: "Analisando faturamento", description: "Processando..." },
          failure: { title: "Falhou faturamento", description: "Erro." },
          run: () => billing.promise,
        });
      }}
    >
      iniciar
    </button>
  );
}

describe("BackgroundTaskProvider", () => {
  it("mantém tarefas simultâneas com estados independentes", async () => {
    render(
      <BackgroundTaskProvider>
        <Starter />
      </BackgroundTaskProvider>,
    );
    fireEvent.click(screen.getByText("iniciar"));
    expect(screen.getByText("Analisando contrato")).toBeTruthy();
    expect(screen.getByText("Analisando faturamento")).toBeTruthy();
    expect(screen.queryAllByLabelText("Fechar aviso de processamento")).toHaveLength(0);

    await act(async () => contract.resolve({ title: "Contrato analisado", description: "Ok." }));
    expect(screen.getByText("Contrato analisado")).toBeTruthy();
    expect(screen.getByText("Analisando faturamento")).toBeTruthy();
    expect(screen.getAllByLabelText("Fechar aviso de processamento")).toHaveLength(1);

    await act(async () => billing.reject(new Error("x")));
    expect(screen.getByText("Falhou faturamento")).toBeTruthy();
    fireEvent.click(screen.getAllByLabelText("Fechar aviso de processamento")[0]);
    expect(screen.queryByText("Contrato analisado")).toBeNull();
    expect(screen.getByText("Falhou faturamento")).toBeTruthy();
  });
});
