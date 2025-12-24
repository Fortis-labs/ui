import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import ApproveButton from './ApproveButton';
import ExecuteButton from './ExecuteButton';
import AccountsCloseButton from './AccountsCloseButton';
import { TableBody, TableCell, TableRow } from './ui/table';
import { useExplorerUrl, useRpcUrl } from '../hooks/useSettings';
import { data, Link } from 'react-router-dom';
import { useMultisig } from '../hooks/useServices';

export enum ProposalStatus {
  NOT_APPROVED = 0,
  APPROVED = 1,
  EXECUTED = 2,
}
interface ActionButtonsProps {
  multisigPda: string;
  transactionIndex: number;
  proposal: multisig.Proposal;
  rentCollector: string;
  programId: string;
}

export default function TransactionTable({
  multisigPda,
  transactions,
  programId,
}: {
  multisigPda: string;
  transactions: {
    transactionPda: string;
    proposal?: multisig.Proposal | null;
    index: bigint;
  }[];
  programId?: string;
}) {
  const { rpcUrl } = useRpcUrl();
  const { data: multisigConfig } = useMultisig();
  if (transactions.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={5}>No transactions found.</TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {transactions.map((tx) => {
        const isClosed = !tx.proposal;

        return (
          <TableRow key={tx.transactionPda.toString()}>
            <TableCell>{Number(tx.index)}</TableCell>

            <TableCell className="text-blue-500">
              <Link
                target={`_blank`}
                to={createSolanaExplorerUrl(tx.transactionPda, rpcUrl!)}

              >
                {tx.transactionPda}
              </Link>
            </TableCell>

            <TableCell>
              {isClosed
                ? "Closed"
                : renderStatus(tx.proposal!.status)}
            </TableCell>

            <TableCell>
              {isClosed ? (
                <p className="text-xs text-stone-400">
                  Proposal closed.
                </p>
              ) : (
                <ActionButtons
                  multisigPda={multisigPda}
                  transactionIndex={Number(tx.index)}
                  proposal={tx.proposal!}
                  rentCollector={multisigConfig?.rentCollector!}
                  programId={programId ?? multisig.FORTIS_MULTISIG_PROGRAM_ADDRESS}
                />
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );
}


function renderStatus(status: number) {
  switch (status) {
    case ProposalStatus.NOT_APPROVED:
      return "Not approved";
    case ProposalStatus.APPROVED:
      return "Approved";
    case ProposalStatus.EXECUTED:
      return "Executed";
    default:
      return "Unknown";
  }
}

function ActionButtons({
  multisigPda,
  transactionIndex,
  proposal,
  rentCollector,
  programId,
}: ActionButtonsProps) {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const canApprove =
    proposal.status === ProposalStatus.NOT_APPROVED &&
    now <= proposal.votingDeadline;

  const canExecute = proposal.status === ProposalStatus.APPROVED;
  // accounts can only be closed if proposal is executed or proposal is not apporved & has passed voting deadline
  const canClose = (proposal.status == ProposalStatus.EXECUTED || (proposal.status == ProposalStatus.NOT_APPROVED && now > proposal.votingDeadline));
  return (
    <>
      <ApproveButton
        multisigPda={multisigPda}
        transactionIndex={transactionIndex}
        proposalStatus={renderStatus(proposal.status)}
        programId={programId}
        disabled={!canApprove}
      />
      <ExecuteButton
        multisigPda={multisigPda}
        transactionIndex={transactionIndex}
        proposalStatus={renderStatus(proposal.status)}
        programId={programId}
        disabled={!canExecute}
      />
      <AccountsCloseButton
        multisigPda={multisigPda}
        transactionIndex={transactionIndex}
        proposalStatus={renderStatus(proposal.status)}
        rentCollector={rentCollector}
        programId={programId}
        disabled={!canClose}
      />
    </>
  );
}

function createSolanaExplorerUrl(publicKey: string, rpcUrl: string): string {
  const { explorerUrl } = useExplorerUrl();
  const baseUrl = `${explorerUrl}/address/`;
  const clusterQuery = '?cluster=custom&customUrl=';
  const encodedRpcUrl = encodeURIComponent(rpcUrl);

  return `${baseUrl}${publicKey}${clusterQuery}${encodedRpcUrl}`;
}
//http://localhost:3000/#/transactions/()%20=%3E%20{%20%20%20%20const%20queryClient%20=%20(0,_tanstack_react_query__WEBPACK_IMPORTED_MODULE_1__.useQueryClient)();%20%20%20%20const%20{%20data:%20explorerUrl%20}%20=%20(0,_tanstack_react_query__WEBPACK_IMPORTED_MODULE_2__.useSuspenseQuery)({%20%20%20%20%20%20%20%20queryKey:%20['explorerUrl'],%20%20%20%20%20%20%20%20queryFn:%20()%20=%3E%20Promise.resolve(getExplorerUrl()),%20%20%20%20});%20%20%20%20const%20setExplorerUrl%20=%20(0,_tanstack_react_query__WEBPACK_IMPORTED_MODULE_3__.useMutation)({%20%20%20%20%20%20%20%20mutationFn:%20(newExplorerUrl)%20=%3E%20{%20%20%20%20%20%20%20%20%20%20%20%20localStorage.setItem('x-explorer-url',%20newExplorerUrl);%20%20%20%20%20%20%20%20%20%20%20%20return%20Promise.resolve(newExplorerUrl);%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20onSuccess:%20(newExplorerUrl)%20=%3E%20{%20%20%20%20%20%20%20%20%20%20%20%20queryClient.setQueryData(['explorerUrl'],%20newExplorerUrl);%20%20%20%20%20%20%20%20},%20%20%20%20});%20%20%20%20return%20{%20explorerUrl,%20setExplorerUrl%20};}/address/Cygt65as8WE8rgUMcEkMxELULbgNsgugE6ToNSMBHSj6?cluster=custom&customUrl=https%3A%2F%2Fdevnet.helius-rpc.com%2F%3Fapi-key%3D64096058-650d-4e15-99cd-842c236765ef