import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
//import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@radix-ui/react-select';
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
    Transaction, TransactionInstruction
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
//import { Label } from '@radix-ui/react-select';
import { AssetOption } from './DepositDialog';
import { useEffect } from 'react';
type WithdrawDialogProps = {
    multisigPda: string;
    assetOptions: AssetOption[];
};

export function WithdrawDialog({ multisigPda, assetOptions }: WithdrawDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMint, setSelectedMint] = useState(assetOptions[0]?.mint || '');
    const [votingDays, setVotingDays] = useState<string>('');
    const [deadlineError, setDeadlineError] = useState('');
    const [amount, setAmount] = useState<string>('');
    const [recipient, setRecipient] = useState('');

    const wallet = useWallet();
    const walletModal = useWalletModal();
    const { connection, rpcUrl } = useMultisigData();
    const queryClient = useQueryClient();

    // Pre-fill recipient with user's address when dialog opens
    useEffect(() => {
        if (isOpen && wallet.publicKey) {
            setRecipient(wallet.publicKey.toBase58());
        }
    }, [isOpen, wallet.publicKey]);

    const selectedAsset = assetOptions.find((a) => a.mint === selectedMint);
    const parsedAmount = parseFloat(amount);
    const isAmountValid =
        !isNaN(parsedAmount) &&
        parsedAmount > 0 &&
        selectedAsset &&
        parsedAmount <= selectedAsset.balance;

    const isRecipientValid = recipient ? new PublicKey(recipient) : false;

    const parseVotingDeadline = (): bigint | null => {
        try {
            const days = Number(votingDays);
            if (isNaN(days) || days <= 0) {
                setDeadlineError('Voting period must be greater than 0 days');
                return null;
            }
            const now = BigInt(Math.floor(Date.now() / 1000));
            const seconds = BigInt(Math.floor(days * 24 * 60 * 60));
            return now + seconds;
        } catch {
            setDeadlineError('Invalid voting period');
            return null;
        }
    };

    const handleWithdraw = async () => {
        if (!wallet.publicKey) throw new Error('Wallet not connected');
        if (!selectedAsset) throw new Error('Invalid asset');
        if (!isRecipientValid) throw new Error('Invalid recipient address');

        const blockhash = (await connection.getLatestBlockhash()).blockhash;
        const votingDeadline = parseVotingDeadline();
        if (!votingDeadline) throw new Error('Invalid voting deadline');

        const vaultAddress = multisig_pda.getVaultPda({
            multisigPda: new PublicKey(multisigPda),
        })[0];
        const multisigPubkey = new PublicKey(multisigPda);
        const recipientPubkey = new PublicKey(recipient);

        const accountInfo = await connection.getAccountInfo(multisigPubkey);
        if (!accountInfo) {
            throw new Error('Multisig account not found');
        }
        const decoder = multisig.getMultisigDecoder();
        const multisigInfo = decoder.decode(accountInfo.data);
        const transactionIndex = BigInt(Number(multisigInfo.transactionIndex) + 1);

        let transferMessage: TransactionMessage;

        if (selectedAsset.mint === 'So11111111111111111111111111111111111111112') {
            // SOL withdrawal
            const lamports = Math.round(parsedAmount * LAMPORTS_PER_SOL);
            const transferIx = SystemProgram.transfer({
                fromPubkey: vaultAddress,
                toPubkey: recipientPubkey,
                lamports,
            });
            transferMessage = new TransactionMessage({
                instructions: [transferIx],
                payerKey: wallet.publicKey,
                recentBlockhash: blockhash,
            });
        } else {
            // SPL withdrawal
            const mintPubkey = new PublicKey(selectedAsset.mint);
            // Source: vault's ATA
            const vaultATA = getAssociatedTokenAddressSync(mintPubkey, vaultAddress, true);
            // Destination: recipient's ATA
            const recipientATA = getAssociatedTokenAddressSync(mintPubkey, recipientPubkey, false);

            const createRecipientATAIx = createAssociatedTokenAccountIdempotentInstruction(
                wallet.publicKey, // payer for ATA creation
                recipientATA,
                recipientPubkey,
                mintPubkey,
                TOKEN_PROGRAM_ID
            );

            const amountAsBigInt = BigInt(
                Math.round(parsedAmount * Math.pow(10, selectedAsset.decimals))
            );

            const transferIx = createTransferCheckedInstruction(
                vaultATA,           // source (owned by vault PDA)
                mintPubkey,
                recipientATA,       // destination
                vaultAddress,       // authority: vault PDA (will be signed via proposal)
                amountAsBigInt,
                selectedAsset.decimals,
                [],
                TOKEN_PROGRAM_ID
            );

            transferMessage = new TransactionMessage({
                instructions: [createRecipientATAIx, transferIx],
                payerKey: wallet.publicKey,
                recentBlockhash: blockhash,
            });
        }

        // Create and approve proposal
        const createIx = await multisig_ixs.proposalCreate({
            multisigPda: new PublicKey(multisigPda),
            creator: wallet.publicKey,
            ephemeralSigners: 0,
            transactionMessage: transferMessage,
            transactionIndex,
            addressLookupTableAccounts: [],
            votingDeadline,
        });

        const approveIx = await multisig_ixs.proposalApprove({
            multisigPda: new PublicKey(multisigPda),
            member: wallet.publicKey,
            transactionIndex,
        });

        const message = new TransactionMessage({
            instructions: [createIx, approveIx],
            payerKey: wallet.publicKey,
            recentBlockhash: blockhash,
        }).compileToV0Message();

        const transaction = new VersionedTransaction(message);
        const signature = await wallet.sendTransaction(transaction, connection, {
            skipPreflight: true,
        });

        toast.loading('Confirming...', { id: 'transaction' });
        const sent = await waitForConfirmation(connection, [signature]);
        if (!sent[0]) {
            throw new Error(`Transaction failed. Check: ${signature}`);
        }

        // Reset form
        setAmount('');
        setVotingDays('');
        setIsOpen(false);
        await queryClient.invalidateQueries({ queryKey: ['transactions', rpcUrl] });
        toast.success('Withdrawal proposal created!', { id: 'transaction' });
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
                    Withdraw
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Create a proposal to withdraw funds from the multisig vault.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label>Recipient Address</label>
                        <Input
                            placeholder="Enter recipient address"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                        />
                        {recipient && !isRecipientValid && (
                            <p className="text-xs text-red-500">Invalid Solana address</p>
                        )}
                    </div>

                    <div>
                        <label>Asset</label>
                        <Select value={selectedMint} onValueChange={setSelectedMint}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent
                                position="item-aligned"
                                className="max-h-60 overflow-y-auto"
                            >
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

                    <div className="space-y-2">
                        <label>
                            Amount (Max: {selectedAsset?.balance ? selectedAsset.balance.toFixed(4) : '0'})
                        </label>
                        <Input
                            type="number"
                            step="any"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                        />
                        {!isAmountValid && amount !== '' && (
                            <p className="text-xs text-red-500">
                                Enter a valid amount (≤ {selectedAsset?.balance?.toFixed(6) || '0'})
                            </p>
                        )}
                    </div>

                    <div>
                        <label>Voting Period (days)</label>
                        <Input
                            placeholder="e.g. 3"
                            type="number"
                            min="1"
                            value={votingDays}
                            onChange={(e) => {
                                setDeadlineError('');
                                setVotingDays(e.target.value);
                            }}
                        />
                        {deadlineError && (
                            <p className="text-xs text-red-500">{deadlineError}</p>
                        )}
                    </div>

                    <Button
                        disabled={!isRecipientValid || !isAmountValid || !votingDays.trim()}
                        onClick={() =>
                            toast.promise(handleWithdraw, {
                                id: 'transaction',
                                loading: 'Creating proposal...',
                                success: 'Withdrawal proposal created!',
                                error: (e) => `Failed: ${e.message || e}`,
                            })
                        }
                    >
                        Create Withdrawal Proposal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}