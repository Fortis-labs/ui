import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import { Button } from './ui/button';
import { useState } from 'react';
import * as multisig_ixs from '../../client/ts/instructions';
import * as multisig_pda from '../../client/ts/pda';
import * as multisig from '../../client/ts/generated';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    TransactionMessage,
    Transaction
} from '@solana/web3.js';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { isPublickey } from '../lib/isPublickey';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { useAccess } from '../hooks/useAccess';
import { waitForConfirmation } from '../lib/transactionConfirmation';

type DepositSolProps = {
    multisigPda: string;
};

const DepositSol = ({ multisigPda }: DepositSolProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const closeDialog = () => setIsOpen(false);
    const wallet = useWallet();
    const walletModal = useWalletModal();
    const [amount, setAmount] = useState<string>('');

    const { connection, rpcUrl } = useMultisigData();
    const queryClient = useQueryClient();
    const parsedAmount = parseFloat(amount);
    const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;

    const transfer = async () => {
        if (!wallet.publicKey) {
            throw 'Wallet not connected';
        }
        const vaultAddress = multisig_pda.getVaultPda({
            multisigPda: new PublicKey(multisigPda)
        })[0];

        const transferInstruction = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: vaultAddress,
            lamports: Math.round(parsedAmount * LAMPORTS_PER_SOL),
        });
        const transaction = new Transaction().add(transferInstruction);

        const signature = await wallet.sendTransaction(transaction, connection, {
            skipPreflight: true,
        });
        console.log('Transaction signature', signature);
        toast.loading('Confirming...', {
            id: 'transaction',
        });
        const sent = await waitForConfirmation(connection, [signature]);
        if (!sent[0]) {
            throw `Transaction failed or unable to confirm. Check ${signature}`;
        }

        setAmount('');
        closeDialog();
        await queryClient.invalidateQueries({ queryKey: ['transactions', rpcUrl] });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    className="shadow-[0_4px_12px_hsla(200,95%,58%,0.25)] hover:shadow-[0_6px_20px_hsla(200,95%,58%,0.4)]"
                    onClick={(e) => {
                        if (!wallet.publicKey) {
                            e.preventDefault();
                            walletModal.setVisible(true);
                        }
                    }}
                >
                    Deposit SOL
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deposit SOL</DialogTitle>
                    <DialogDescription>
                        Transfer Sol to multisig vault.
                    </DialogDescription>
                </DialogHeader>

                {/* Show user's wallet address (read-only) */}
                {wallet.publicKey ? (
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">From your wallet</p>
                        <p className="font-mono text-sm break-all bg-muted p-2 rounded text-xs">
                            {wallet.publicKey.toBase58()}
                        </p>
                    </div>
                ) : null}
                <Input
                    placeholder="Amount (SOL)"
                    type="number"
                    onChange={(e) => setAmount(e.target.value)}
                />
                {!isAmountValid && amount && (
                    <p className="text-xs text-red-500">Invalid amount</p>
                )}

                <Button
                    disabled={!isAmountValid || !wallet.publicKey}
                    onClick={() =>
                        toast.promise(transfer, {
                            id: 'transaction',
                            loading: 'Initiating transfer...',
                            success: 'Deposit successful!',
                            error: (e) => `Failed: ${e}`,
                        })
                    }
                >
                    Deposit SOL
                </Button>
            </DialogContent>
        </Dialog>
    );
};
export default DepositSol;