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
import * as multisig_ixs from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/instructions';
import * as multisig_pda from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/pda';
import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { isPublickey } from '../lib/isPublickey';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { useAccess } from '../hooks/useAccess';
import { waitForConfirmation } from '../lib/transactionConfirmation';

type SendSolProps = {
  multisigPda: string;
  votingDeadline: bigint;
};

const SendSol = ({ multisigPda, votingDeadline }: SendSolProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = () => setIsOpen(false);
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState('');
  const { connection, programId } = useMultisigData();
  const queryClient = useQueryClient();
  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const isMember = useAccess();

  const transfer = async () => {
    if (!wallet.publicKey) {
      throw 'Wallet not connected';
    }

    const vaultAddress = multisig_pda.getVaultPda({
      multisigPda: new PublicKey(multisigPda)
    })[0];

    const transferInstruction = SystemProgram.transfer({
      fromPubkey: vaultAddress,
      toPubkey: new PublicKey(recipient),
      lamports: parsedAmount * LAMPORTS_PER_SOL,
    });

    const multisigPubkey = new PublicKey(multisigPda);
    const decoder = multisig.getMultisigDecoder();
    const accountInfo = await connection.getAccountInfo(multisigPubkey);
    if (!accountInfo) {
      throw new Error("Multisig not found");
    }
    const multisigInfo = decoder.decode(accountInfo.data);

    const blockhash = (await connection.getLatestBlockhash()).blockhash;

    const transferMessage = new TransactionMessage({
      instructions: [transferInstruction],
      payerKey: new PublicKey(vaultAddress),
      recentBlockhash: blockhash,
    });

    const transactionIndex = Number(multisigInfo.transactionIndex) + 1;
    const transactionIndexBN = BigInt(transactionIndex);

    const createIx = await multisig_ixs.proposalCreate({
      multisigPda: new PublicKey(multisigPda),
      creator: wallet.publicKey,
      ephemeralSigners: 0,
      transactionMessage: transferMessage,
      transactionIndex: transactionIndexBN,
      addressLookupTableAccounts: [],
      votingDeadline: votingDeadline,

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
    closeDialog();
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
            } else {
              setIsOpen(true);
            }
          }}
        >
          Send SOL
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer SOL</DialogTitle>
          <DialogDescription>
            Create a proposal to transfer SOL to another address.
          </DialogDescription>
        </DialogHeader>
        <Input placeholder="Recipient" type="text" onChange={(e) => setRecipient(e.target.value)} />
        {isPublickey(recipient) ? null : <p className="text-xs">Invalid recipient address</p>}
        <Input placeholder="Amount" type="number" onChange={(e) => setAmount(e.target.value)} />
        {!isAmountValid && amount.length > 0 && (
          <p className="text-xs text-red-500">Invalid amount</p>
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
          disabled={!isPublickey(recipient)}
        >
          Transfer
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SendSol;
