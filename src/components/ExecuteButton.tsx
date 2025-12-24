import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Button } from './ui/button';
import * as multisig_ixs from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/instructions';
import * as multisig_pda from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/pda';
import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import { Dialog, DialogDescription, DialogHeader } from './ui/dialog';
import { DialogTrigger } from './ui/dialog';
import { DialogContent, DialogTitle } from './ui/dialog';
import { useState } from 'react';
import { Input } from './ui/input';
import { range } from '../lib/utils';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { waitForConfirmation } from '../lib/transactionConfirmation';

type WithALT = {
  instruction: TransactionInstruction;
  lookupTableAccounts: AddressLookupTableAccount[];
};

type ExecuteButtonProps = {
  multisigPda: string;
  transactionIndex: number;
  proposalStatus: string;
  programId: string;
  disabled?: boolean; // optional, can be controlled from parent
};

const ExecuteButton = ({
  multisigPda,
  transactionIndex,
  proposalStatus,
  programId,
  disabled
}: ExecuteButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = () => setIsOpen(false);
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const [priorityFeeLamports, setPriorityFeeLamports] = useState<number>(5000);
  const [computeUnitBudget, setComputeUnitBudget] = useState<number>(200_000);

  const isTransactionReady = proposalStatus === 'Approved';

  const { connection } = useMultisigData();
  const queryClient = useQueryClient();

  const executeTransaction = async () => {
    if (!wallet.publicKey) {
      walletModal.setVisible(true);
      throw 'Wallet not connected';
    }
    // HARD GUARD (important)
    if (disabled) {
      return;
    }

    const member = wallet.publicKey;
    if (!wallet.signAllTransactions) return;
    let bigIntTransactionIndex = BigInt(transactionIndex);

    if (!isTransactionReady) {
      toast.error('Proposal has not reached threshold.');
      return;
    }

    console.log({
      multisigPda: multisigPda,
      connection,
      member: member.toBase58(),
      transactionIndex: bigIntTransactionIndex,
      programId: programId ? programId : multisig,
    });

    const [transactionPda] = multisig_pda.getTransactionPda({
      multisigPda: new PublicKey(multisigPda),
      index: bigIntTransactionIndex,

    });

    let txData;
    try {

      const accountInfo = await connection.getAccountInfo(transactionPda);
      if (!accountInfo) {
        throw new Error("Multisig not found");
      }
      const VaultTransactionInfo = multisig.getVaultTransactionDecoder().decode(accountInfo.data);
    } catch (error) {
    }

    let transactions: VersionedTransaction[] = [];

    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFeeLamports,
    });
    const computeUnitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnitBudget,
    });

    let blockhash = (await connection.getLatestBlockhash()).blockhash;
    const resp = await multisig_ixs.proposalExecute({
      multisigPda: new PublicKey(multisigPda),
      connection,
      member,
      transactionIndex: bigIntTransactionIndex,
    });
    transactions.push(
      new VersionedTransaction(
        new TransactionMessage({
          instructions: [priorityFeeInstruction, computeUnitInstruction, resp.instruction],
          payerKey: member,
          recentBlockhash: blockhash,
        }).compileToV0Message(resp.lookupTableAccounts)
      )
    );


    const signedTransactions = await wallet.signAllTransactions(transactions);

    let signatures = [];
    for (const signedTx of signedTransactions) {
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
      });
      signatures.push(signature);
      console.log('Transaction signature', signature);
      toast.loading('Confirming...', {
        id: 'transaction',
      });
    }
    const sent = await waitForConfirmation(connection, signatures);
    console.log('sent', sent);
    if (!sent.every((sent) => !!sent)) {
      throw `Unable to confirm`;
    }
    closeDialog();
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        disabled={!isTransactionReady}
        className={`mr-2 h-10 px-4 py-2 ${!isTransactionReady ? `bg-primary/50` : `bg-primary hover:bg-primary/90`} rounded-md text-primary-foreground`}
        onClick={() => setIsOpen(true)}
      >
        Execute
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Execute Transaction</DialogTitle>
          <DialogDescription>
            Select custom priority fees and compute unit limits and execute transaction.
          </DialogDescription>
        </DialogHeader>
        <h3>Priority Fee in lamports</h3>
        <Input
          placeholder="Priority Fee"
          onChange={(e) => setPriorityFeeLamports(Number(e.target.value))}
          value={priorityFeeLamports}
        />

        <h3>Compute Unit Budget</h3>
        <Input
          placeholder="Priority Fee"
          onChange={(e) => setComputeUnitBudget(Number(e.target.value))}
          value={computeUnitBudget}
        />
        <Button
          disabled={!isTransactionReady}
          onClick={() =>
            toast.promise(executeTransaction, {
              id: 'transaction',
              loading: 'Loading...',
              success: 'Transaction executed.',
              error: 'Failed to execute. Check console for info.',
            })
          }
          className="mr-2"
        >
          Execute
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ExecuteButton;
