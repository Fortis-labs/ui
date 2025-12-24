import { PublicKey, Transaction } from '@solana/web3.js';
import { Button } from './ui/button';
import * as multisig_ixs from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/instructions';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { waitForConfirmation } from '../lib/transactionConfirmation';

type ApproveButtonProps = {
  multisigPda: string;
  transactionIndex: number;
  proposalStatus: string;
  programId: string;
  disabled?: boolean; // optional, can be controlled from parent
};
const ApproveButton = ({
  multisigPda,
  transactionIndex,
  proposalStatus,
  programId,
  disabled
}: ApproveButtonProps) => {
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const { connection } = useMultisigData();
  const queryClient = useQueryClient();
  const approveProposal = async () => {
    if (!wallet.publicKey) {
      walletModal.setVisible(true);
      throw 'Wallet not connected';
    }

    // HARD GUARD (important)
    if (disabled) {
      return;
    }

    const tx = new Transaction();

    tx.add(
      await multisig_ixs.proposalApprove({
        multisigPda: new PublicKey(multisigPda),
        member: wallet.publicKey,
        transactionIndex: BigInt(transactionIndex),
      })
    );

    const signature = await wallet.sendTransaction(tx, connection, {
      skipPreflight: true,
    });

    toast.loading('Confirming...', { id: 'transaction' });

    const [confirmed] = await waitForConfirmation(connection, [signature]);
    if (!confirmed) {
      throw `Transaction failed or unable to confirm: ${signature}`;
    }

    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  return (
    <Button
      disabled={disabled}
      onClick={() =>
        toast.promise(approveProposal, {
          id: 'transaction',
          loading: 'Loading...',
          success: 'Transaction approved.',
          error: (e) => `Failed to approve: ${e}`,
        })
      }
      className="mr-2"
    >
      Approve
    </Button>
  );
};
export default ApproveButton;