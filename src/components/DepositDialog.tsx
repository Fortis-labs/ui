import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import { Button } from './ui/button';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@radix-ui/react-select';
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
    VersionedTransaction,
    Transaction
} from '@solana/web3.js';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { isPublickey } from '../lib/isPublickey';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { useAccess } from '../hooks/useAccess';
import { waitForConfirmation } from '../lib/transactionConfirmation';
import { Label } from '@radix-ui/react-select';
export type AssetOption = {
    mint: string;
    balance: number;
    decimals: number;
    tokenAccount: string | undefined;
};

type DepositDialogProps = {
    multisigPda: string;
    assetOptions: AssetOption[];
    programId: string;
};

export function DepositDialog({ multisigPda, assetOptions }: DepositDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMint, setSelectedMint] = useState(assetOptions[0]?.mint || '');
    const [amount, setAmount] = useState('');
    const wallet = useWallet();
    const walletModal = useWalletModal();
    const { connection, rpcUrl } = useMultisigData();
    const queryClient = useQueryClient();

    const selectedAsset = assetOptions.find(a => a.mint === selectedMint);
    const parsedAmount = parseFloat(amount);
    const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= (selectedAsset?.balance || 0);
    const handleDeposit = async () => {
        if (!wallet.publicKey) throw new Error('Wallet not connected');
        if (!selectedAsset) throw new Error('Invalid asset');
        const vaultAddress = multisig_pda.getVaultPda({ multisigPda: new PublicKey(multisigPda) })[0];
        try {
            let signature: string;

            if (selectedAsset.mint === 'So11111111111111111111111111111111111111112') {
                // SOL deposit

                const lamports = Math.round(parsedAmount * LAMPORTS_PER_SOL);
                const ix = SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: vaultAddress,
                    lamports,
                });
                const tx = new Transaction().add(ix);
                signature = signature = await wallet.sendTransaction(tx, connection, {
                    skipPreflight: true,
                });
            } else {
                // SPL Token deposit
                const mintPubkey = new PublicKey(selectedAsset.mint);
                const sourceTokenAccount = new PublicKey(selectedAsset.tokenAccount!);
                const vaultPubkey = new PublicKey(vaultAddress);
                const mintAccountInfo = await connection.getAccountInfo(new PublicKey(selectedAsset.mint));
                const TOKEN_PROGRAM = mintAccountInfo?.owner || TOKEN_PROGRAM_ID;

                const vaultATA = getAssociatedTokenAddressSync(
                    mintPubkey,
                    vaultPubkey,
                    true,
                    TOKEN_PROGRAM
                );
                const createVaultATAIx = createAssociatedTokenAccountIdempotentInstruction(
                    wallet.publicKey,
                    vaultATA,
                    vaultPubkey,
                    mintPubkey, TOKEN_PROGRAM
                );

                const amountAsBigInt = BigInt(
                    Math.round(parsedAmount * Math.pow(10, selectedAsset.decimals))
                );

                const transferIx = createTransferCheckedInstruction(
                    sourceTokenAccount,
                    mintPubkey,
                    vaultATA,
                    wallet.publicKey,
                    amountAsBigInt,
                    selectedAsset.decimals, [],
                    TOKEN_PROGRAM
                );


                const tx = new Transaction().add(createVaultATAIx, transferIx);
                signature = signature = await wallet.sendTransaction(tx, connection, {
                    skipPreflight: true,
                });
            }
            toast.loading('Confirming...', { id: 'transaction' });
            const sent = await waitForConfirmation(connection, [signature]);
            if (!sent[0]) {
                throw new Error(`Transaction failed. Check: ${signature}`);
            }

            setAmount('');
            setIsOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['transactions', rpcUrl] });
            toast.success('Deposit successful!', { id: 'transaction' });
        } catch (err: any) {
            console.error('Deposit error:', err);
            throw new Error(err?.message || err.toString());
        }
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
                    Deposit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deposit Funds</DialogTitle>
                    <DialogDescription>
                        Transfer funds from your wallet to the multisig vault.
                    </DialogDescription>
                </DialogHeader>

                {wallet.publicKey ? (
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">From your wallet</p>
                        <p className="font-mono text-sm break-all bg-muted p-2 rounded text-xs">
                            {wallet.publicKey.toBase58()}
                        </p>
                    </div>
                ) : null}

                <div className="space-y-4">
                    <div>
                        <Label>Asset</Label>
                        <Select value={selectedMint} onValueChange={setSelectedMint}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent>
                                {assetOptions.map((asset) => (
                                    <SelectItem key={asset.mint} value={asset.mint}>
                                        {asset.mint === 'So11111111111111111111111111111111111111112'
                                            ? 'SOL'
                                            : asset.mint}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>
                            Amount (Max: {selectedAsset?.balance ? selectedAsset.balance.toFixed(6) : '0'})
                        </Label>
                        <Input
                            type="number"
                            step="any"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                        />
                    </div>

                    {!isAmountValid && amount !== '' && (
                        <p className="text-xs text-red-500">
                            Enter a valid amount (≤ {selectedAsset?.balance?.toFixed(6) || '0'})
                        </p>
                    )}

                    <Button
                        disabled={!isAmountValid || !wallet.publicKey}
                        onClick={() =>
                            toast.promise(handleDeposit, {
                                id: 'transaction',
                                loading: 'Depositing...',
                                success: 'Deposited!',
                                error: (e) => `Failed: ${e.message || e}`,
                            })
                        }
                    >
                        Confirm Deposit
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}