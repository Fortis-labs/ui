import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import * as bs58 from 'bs58';
import { Button } from './ui/button';
import { useState } from 'react';
import * as multisig_pda from '../../client/ts/pda';
import { useWallet } from '@solana/wallet-adapter-react';
import { Message, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { simulateEncodedTransaction } from '../lib/transaction/simulateEncodedTransaction';
import { importTransaction } from '../lib/transaction/importTransaction';
import { useMultisigData } from '../hooks/useMultisigData';
import invariant from 'invariant';
import { VaultSelector } from './VaultSelector';


const CreateTransaction = () => {
  const wallet = useWallet();

  const [tx, setTx] = useState('');
  const [open, setOpen] = useState(false);

  const { connection, multisigAddress, programId } = useMultisigData();
  const [votingDays, setVotingDays] = useState<string>('');
  const [deadlineError, setDeadlineError] = useState('');
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
  const getSampleMessage = async () => {
    invariant(programId, 'Program ID not found');
    invariant(multisigAddress, 'Multisig address not found. Please create a multisig first.');
    invariant(wallet.publicKey, 'Wallet ID not found');
    let memo = 'Hello from Solana land!';
    const vaultAddress = multisig_pda.getVaultPda({
      multisigPda: new PublicKey(multisigAddress),
    })[0];

    const dummyMessage = Message.compile({
      instructions: [
        new TransactionInstruction({
          keys: [
            {
              pubkey: wallet.publicKey,
              isSigner: true,
              isWritable: true,
            },
          ],
          data: Buffer.from(memo, 'utf-8'),
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        }),
      ],
      payerKey: vaultAddress,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    });

    const encoded = bs58.default.encode(dummyMessage.serialize());

    setTx(encoded);
  };
  const handleImport = () => {
    const votingDeadline = parseVotingDeadline();
    if (!votingDeadline) return;

    if (!multisigAddress) return;

    toast.promise(
      importTransaction(tx, connection, multisigAddress, votingDeadline, wallet),
      {
        id: 'transaction',
        loading: 'Building transaction...',
        success: () => {
          setOpen(false);
          return 'Transaction proposed.';
        },
        error: (e) => `Failed to propose: ${e}`,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger
        className={`h-10 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground ${!wallet?.publicKey ? 'bg-primary/50 hover:bg-primary/50' : 'hover:bg-primary/90'
          }`}
        disabled={!wallet?.publicKey}
      >
        Import Transaction
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Transaction</DialogTitle>
          <DialogDescription>
            Propose a transaction from a base58 encoded transaction message (not a transaction).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <p>Using Vault Index:</p>
          <VaultSelector />
        </div>

        <Input
          placeholder="Paste base58 encoded transaction..."
          type="text"
          value={tx}
          onChange={(e) => setTx(e.target.value.trim())}
        />

        <div className="flex flex-col gap-1 mt-2">
          <Input
            placeholder="Voting period (days)"
            type="number"
            value={votingDays}
            onChange={(e) => setVotingDays(e.target.value)}
          />
          {deadlineError && <p className="text-red-500 text-xs">{deadlineError}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            onClick={() => {
              toast('Note: Simulations may fail on alt-SVM', {
                description: 'Please verify via an explorer before submitting.',
              });
              toast.promise(simulateEncodedTransaction(tx, connection, wallet), {
                id: 'simulation',
                loading: 'Building simulation...',
                success: 'Simulation successful.',
                error: (e) => `${e}`,
              });
            }}
          >
            Simulate
          </Button>

          {multisigAddress && (
            <Button onClick={handleImport}>
              Import
            </Button>
          )}
        </div>

        <button
          onClick={getSampleMessage}
          disabled={!wallet?.publicKey}
          className="flex cursor-pointer justify-end text-xs text-stone-400 underline hover:text-stone-200 mt-2"
        >
          Click to use a sample memo for testing
        </button>
      </DialogContent>
    </Dialog>
  );
};
export default CreateTransaction;