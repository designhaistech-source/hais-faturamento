import { useQuery } from "@tanstack/react-query";

import { FileExtractedDataPage, contractsQueryKey, listContracts } from "@/features/contracts";
import { LoadingState } from "@/components/data-state";
import { getOperator, resolveOperatorContractId } from "../data/operators";

/** Resolve a operadora e o contrato antes de abrir os dados extraídos do arquivo. */
export function OperatorFileDataPage({
  operatorId,
  fileId,
}: {
  operatorId: string;
  fileId: string;
}) {
  const operatorQuery = useQuery({
    queryKey: ["operators", operatorId],
    queryFn: () => getOperator(operatorId),
  });
  const contractsQuery = useQuery({ queryKey: contractsQueryKey, queryFn: listContracts });
  const operator = operatorQuery.data;
  const contractId = operator
    ? resolveOperatorContractId(operator, contractsQuery.data ?? [])
    : null;

  if (!operator || !contractId) {
    return (
      <div className="p-6">
        <LoadingState title="Carregando dados extraídos" />
      </div>
    );
  }
  return (
    <FileExtractedDataPage
      operator={{ id: operator.id, name: operator.name }}
      contractId={contractId}
      fileId={fileId}
    />
  );
}
