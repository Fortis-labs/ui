import { PublicKey, Transaction } from '@solana/web3.js';
import { Button } from './ui/button';
import * as multisig_ixs from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/instructions';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { waitForConfirmation } from '../lib/transactionConfirmation';

type AccountsCloseButtonProps = {
    multisigPda: string;
    transactionIndex: number;
    proposalStatus: string;
    rentCollector: string;
    programId: string;
    disabled?: boolean; // optional, can be controlled from parent
};
const AccountsCloseButton = ({
    multisigPda,
    transactionIndex,
    proposalStatus,
    rentCollector,
    programId,
    disabled
}: AccountsCloseButtonProps) => {
    const wallet = useWallet();
    const { connection } = useMultisigData();
    const queryClient = useQueryClient();
    const accountsClose = async () => {
        //accounts close requires no signer
        // HARD GUARD (important)
        if (disabled) {
            return;
        }

        const tx = new Transaction();

        tx.add(
            await multisig_ixs.ProposalAccountsClose({
                rentCollector: new PublicKey(rentCollector),
                multisigPda: new PublicKey(multisigPda),
                transactionIndex: BigInt(transactionIndex),
            })
        );

        const signature = await wallet.sendTransaction(tx, connection, {
            skipPreflight: true,
        });
        //TODO:FIGURE OUT CORRECT SIGNATURE USAGE
        // const signature = await connection.sendTransaction(tx, [], { skipPreflight: true });
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
                toast.promise(accountsClose, {
                    id: 'transaction',
                    loading: 'Loading...',
                    success: 'Transaction approved.',
                    error: (e) => `Failed to approve: ${e}`,
                })
            }
            className="mr-2"
        >
            Close Accounts
        </Button>
    );
};
export default AccountsCloseButton;