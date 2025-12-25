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
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as multisig_pda from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/pda';
import * as multisig_ixs from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/instructions';
import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { isPublickey } from '../lib/isPublickey';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { useAccess } from '../hooks/useAccess';
import { waitForConfirmation } from '../lib/transactionConfirmation';

type SendTokensProps = {
  tokenAccount: string;
  mint: string;
  decimals: number;
  multisigPda: string;
  programId?: string;
};

const SendTokens = ({
  tokenAccount,
  mint,
  decimals,
  multisigPda,
  programId,
}: SendTokensProps) => {
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState('');
  const [votingDays, setVotingDays] = useState<string>('');
  const [deadlineError, setDeadlineError] = useState('');
  const { connection, rpcUrl } = useMultisigData();

  const queryClient = useQueryClient();
  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const isMember = useAccess();
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

  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = () => setIsOpen(false);

  const transfer = async () => {
    if (!wallet.publicKey) {
      throw 'Wallet not connected';
    }
    setDeadlineError('');
    const votingDeadline = parseVotingDeadline();
    if (!votingDeadline) throw 'Invalid voting deadline';

    const mintAccountInfo = await connection.getAccountInfo(new PublicKey(mint));
    const TOKEN_PROGRAM = mintAccountInfo?.owner || TOKEN_PROGRAM_ID;

    const recipientATA = getAssociatedTokenAddressSync(
      new PublicKey(mint),
      new PublicKey(recipient),
      true,
      TOKEN_PROGRAM
    );

    const vaultAddress = multisig_pda
      .getVaultPda({
        multisigPda: new PublicKey(multisigPda),

      })[0]
      .toBase58();

    const createRecipientATAInstruction = createAssociatedTokenAccountIdempotentInstruction(
      new PublicKey(vaultAddress),
      recipientATA,
      new PublicKey(recipient),
      new PublicKey(mint),
      TOKEN_PROGRAM
    );

    const transferInstruction = createTransferCheckedInstruction(
      new PublicKey(tokenAccount),
      new PublicKey(mint),
      recipientATA,
      new PublicKey(vaultAddress),
      parsedAmount * 10 ** decimals,
      decimals,
      [],
      TOKEN_PROGRAM
    );

    const multisigPubkey = new PublicKey(multisigPda);
    const decoder = multisig.getMultisigDecoder();
    const accountInfo = await connection.getAccountInfo(multisigPubkey);
    if (!accountInfo) {
      throw new Error("Multisig not found");
    }
    const multisigInfo = decoder.decode(accountInfo.data);
    const blockhash = (await connection.getLatestBlockhash()).blockhash;

    const transferMessage = new TransactionMessage({
      instructions: [createRecipientATAInstruction, transferInstruction],
      payerKey: new PublicKey(vaultAddress),
      recentBlockhash: blockhash,
    });

    const transactionIndex = Number(multisigInfo.transactionIndex) + 1;
    const transactionIndexBN = BigInt(transactionIndex);


    const createIx = await multisig_ixs.proposalCreate({
      creator: wallet.publicKey,
      multisigPda: new PublicKey(multisigPda),
      ephemeralSigners: 0,
      votingDeadline: votingDeadline,
      transactionMessage: transferMessage,
      addressLookupTableAccounts: [],
      transactionIndex: transactionIndexBN,

    });

    const approveIx = await multisig_ixs.proposalApprove({
      multisigPda: new PublicKey(multisigPda),
      member: wallet.publicKey,
      transactionIndex: transactionIndexBN,

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
    console.log('Transaction signature', signature);
    toast.loading('Confirming...', {
      id: 'transaction',
    });
    const sent = await waitForConfirmation(connection, [signature]);
    if (!sent[0]) {
      throw `Transaction failed or unable to confirm. Check ${signature}`;
    }
    setAmount('');
    setRecipient('');
    setVotingDays('');
    await queryClient.invalidateQueries({ queryKey: ['transactions', rpcUrl] });
    closeDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={!isMember}
          onClick={(e) => {
            if (!wallet.publicKey) {
              e.preventDefault();
              walletModal.setVisible(true);
              return;
            }
          }}
        >
          Send Tokens
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer tokens</DialogTitle>
          <DialogDescription>
            Create a proposal to transfer tokens to another address.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Recipient"
          type="text"
          onChange={(e) => setRecipient(e.target.value.trim())}
        />
        {isPublickey(recipient) ? null : <p className="text-xs">Invalid recipient address</p>}
        <Input
          placeholder="Amount"
          type="number"
          onChange={(e) => setAmount(e.target.value.trim())}
        />
        {!isAmountValid && amount.length > 0 && (
          <p className="text-xs text-red-500">Invalid amount</p>
        )}
        <Input
          placeholder="Voting period (days)"
          type="number"
          min={1}
          onChange={(e) => { setDeadlineError(''); setVotingDays(e.target.value) }}
        />
        {deadlineError && (
          <p className="text-xs text-red-500">{deadlineError}</p>
        )}
        <Button
          onClick={() =>
            toast.promise(transfer, {
              id: 'transaction',
              loading: 'Loading...',
              success: 'Transfer proposed.',
              error: (e) => `Failed to propose: ${e}`,
            })
          }
          disabled={!isPublickey(recipient) || amount.length < 1 || !isAmountValid || !votingDays}
        >
          Transfer
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SendTokens;
