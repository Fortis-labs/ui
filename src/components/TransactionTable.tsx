import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import ApproveButton from './ApproveButton';
import ExecuteButton from './ExecuteButton';
import AccountsCloseButton from './AccountsCloseButton';
import { TableBody, TableCell, TableRow } from './ui/table';
import { resolveRpc } from '../hooks/useNetwork';
import { DEFAULT_EXPLORER_URL } from '../hooks/useSettings';
import { data, Link } from 'react-router-dom';
import { useMultisig } from '../hooks/useServices';
import { useNetwork } from '../hooks/useNetwork';
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
  const { network, customRpc } = useNetwork();

  const rpcUrl = resolveRpc(network, customRpc);
  //const { rpcUrl } = useRpcUrl();
  const { data: multisigConfig } = useMultisig();
  const explorerUrl = DEFAULT_EXPLORER_URL
  if (transactions.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <span className="text-4xl opacity-50">📭</span>
              <p>No transactions found.</p>
            </div>
          </TableCell>
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
          <TableRow
            key={tx.transactionPda}
            className="hover:bg-muted/50 hover:shadow-[0_0_12px_hsla(200,95%,58%,0.05)] transition-all duration-200"
          >
            <TableCell className="font-mono text-sm">
              <span className="px-2 py-1 rounded bg-muted text-foreground">
                #{Number(tx.index)}
              </span>
            </TableCell>

            <TableCell>
              <Link
                target="_blank"
                to={createExplorerUrl(tx.transactionPda)}
                className="text-[hsl(200,95%,58%)] hover:text-[hsl(210,90%,52%)] font-mono text-sm underline-offset-4 hover:underline transition-colors"
              >
                {tx.transactionPda.slice(0, 8)}...{tx.transactionPda.slice(-8)}
              </Link>
            </TableCell>

            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isClosed
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-gradient-to-br from-[hsl(200,95%,58%)] to-[hsl(210,90%,52%)] text-white'
                }`}>
                {isClosed ? 'Closed' : renderStatus(tx.proposal!.status)}
              </span>
            </TableCell>

            <TableCell>
              {isClosed ? (
                <p className="text-xs text-muted-foreground">Proposal closed.</p>
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
  // Log for debugging purposes

  console.log('transaction index:', transactionIndex);
  console.log('Proposal Status:', proposal.status);
  console.log('Current Time:', now);
  console.log('Voting Deadline:', proposal.votingDeadline);
  console.log('Can Close:', canClose);

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
