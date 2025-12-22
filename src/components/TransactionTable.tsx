import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import ApproveButton from './ApproveButton';
import ExecuteButton from './ExecuteButton';
import { TableBody, TableCell, TableRow } from './ui/table';
import { useExplorerUrl, useRpcUrl } from '../hooks/useSettings';
import { Link } from 'react-router-dom';
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
    proposal: multisig.Proposal;
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
      {transactions.map((tx) => (
        <TableRow key={tx.transactionPda}>
          <TableCell>{Number(tx.index)}</TableCell>

          <TableCell className="text-blue-500">
            <Link
              target="_blank"
              to={`${useExplorerUrl}/address/${tx.transactionPda}?cluster=custom&customUrl=${encodeURIComponent(
                rpcUrl!
              )}`}
            >
              {tx.transactionPda}
            </Link>
          </TableCell>

          <TableCell>{renderStatus(tx.proposal.status)}</TableCell>

          <TableCell>
            <ActionButtons
              multisigPda={multisigPda}
              transactionIndex={Number(tx.index)}
              proposal={tx.proposal}
              programId={programId ?? multisig.FORTIS_MULTISIG_PROGRAM_ADDRESS}
            />
          </TableCell>
        </TableRow>
      ))}
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
  programId,
}: ActionButtonsProps) {
  const now = BigInt(Math.floor(Date.now() / 1000));

  const canApprove =
    proposal.status === ProposalStatus.NOT_APPROVED &&
    now <= proposal.votingDeadline;

  const canExecute = proposal.status === ProposalStatus.APPROVED;

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