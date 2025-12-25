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
  const { explorerUrl } = useExplorerUrl(); // ✅ hook at top level
  if (transactions.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={5}>No transactions found.</TableCell>
        </TableRow>
      </TableBody>
    );
  }
  const createExplorerUrl = (publicKey: string) => {
    const clusterQuery = '?cluster=custom&customUrl=';
    const encodedRpcUrl = encodeURIComponent(rpcUrl!);
    return `${explorerUrl}/address/${publicKey}${clusterQuery}${encodedRpcUrl}`;
  };

  return (
    <TableBody>
      {transactions.map((tx) => {
        const isClosed = !tx.proposal;

        return (
          <TableRow key={tx.transactionPda}>
            <TableCell>{Number(tx.index)}</TableCell>

            <TableCell className="text-blue-500">
              <Link
                target="_blank"
                to={createExplorerUrl(tx.transactionPda)}
              >
                {tx.transactionPda}
              </Link>
            </TableCell>

            <TableCell>
              {isClosed ? 'Closed' : renderStatus(tx.proposal!.status)}
            </TableCell>

            <TableCell>
              {isClosed ? (
                <p className="text-xs text-stone-400">Proposal closed.</p>
              ) : (
                <ActionButtons
                  multisigPda={multisigPda}
                  transactionIndex={Number(tx.index)}
                  proposal={tx.proposal!}
                  rentCollector={multisigConfig?.rentCollector!}
                  programId={
                    programId ?? multisig.FORTIS_MULTISIG_PROGRAM_ADDRESS
                  }
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
  // Log for debugging purposes
  /*
  console.log('transaction index:', transactionIndex);
  console.log('Proposal Status:', proposal.status);
  console.log('Current Time:', now);
  console.log('Voting Deadline:', proposal.votingDeadline);
  console.log('Can Close:', canClose);
*/
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
