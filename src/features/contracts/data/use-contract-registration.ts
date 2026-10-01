import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useBackgroundTask } from "@/components/background-task";
import { CURRENT_USER } from "@/lib/current-user";
import type { NewContractInput } from "./contracts";
import { contractsQueryKey, createContract } from "./contracts-service";
import { contractRulesStatusQueryKey } from "./contract-rules-service";
import { extractContractRulesFor } from "./contract-extraction";
import {
  contractAmendmentsQueryKey,
  createContractAmendment,
  extractAmendment,
} from "./contract-amendments-service";

/** Cadastro de contrato seguido da leitura automática em segundo plano. */
export function useCreateContract() {
  const queryClient = useQueryClient();
  const backgroundTask = useBackgroundTask();

  return useMutation({
    mutationFn: (input: NewContractInput) => createContract(input),
    onSuccess: async (contract) => {
      await queryClient.invalidateQueries({ queryKey: contractsQueryKey });
      backgroundTask.start({
        kind: "contract-rules",
        fileName: contract.file.name,
        processing: {
          title: "Extraindo dados do contrato",
          description: "Extraindo as informações do contrato...",
        },
        failure: {
          title: "Falha na extração",
          description: "Não foi possível extrair os dados do contrato.",
        },
        run: async () => {
          try {
            const drafts = await extractContractRulesFor(contract);
            return {
              title: drafts.length > 0 ? "Dados extraídos" : "Nenhum dado identificado",
              description:
                drafts.length > 0
                  ? "Os dados do contrato estão disponíveis para consulta."
                  : "Nenhuma informação relevante foi identificada no contrato.",
            };
          } finally {
            await queryClient.invalidateQueries({ queryKey: contractRulesStatusQueryKey });
          }
        },
      });
    },
    onError: () => toast.error("Não foi possível cadastrar o contrato."),
  });
}

export interface NewAmendmentInput {
  contract: { id: string; company: string };
  file: File;
}

/** Envio de aditivo seguido da leitura automática em segundo plano. */
export function useCreateAmendment() {
  const queryClient = useQueryClient();
  const backgroundTask = useBackgroundTask();

  return useMutation({
    mutationFn: async ({ contract, file }: NewAmendmentInput) => ({
      contract,
      amendment: await createContractAmendment({
        contractId: contract.id,
        file,
        createdBy: CURRENT_USER.name,
      }),
    }),
    onSuccess: async ({ contract, amendment }) => {
      const queryKey = contractAmendmentsQueryKey(contract.id);
      await queryClient.invalidateQueries({ queryKey });
      backgroundTask.start({
        kind: "contract-amendment",
        fileName: amendment.file.name,
        processing: {
          title: "Extraindo dados do aditivo",
          description: "Extraindo as informações do aditivo...",
        },
        failure: {
          title: "Falha na extração",
          description: "Não foi possível extrair os dados do aditivo.",
        },
        run: async () => {
          try {
            const status = await extractAmendment(amendment, contract.company);
            return status === "available"
              ? { title: "Dados extraídos", description: "O aditivo foi processado com sucesso." }
              : {
                  title: "Nenhum dado identificado",
                  description: "Nenhuma informação relevante foi identificada no aditivo.",
                  tone: "warning" as const,
                };
          } finally {
            await queryClient.invalidateQueries({ queryKey });
          }
        },
      });
    },
    onError: () => toast.error("Não foi possível adicionar o aditivo."),
  });
}
