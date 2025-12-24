import { Button } from './ui/button';
import { Input } from './ui/input';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { getAddressDecoder } from '@solana/kit';
import { Card, CardContent, CardTitle } from './ui/card';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import * as multisig_ixs from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/instructions';
import {
  AccountMeta,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { toast } from 'sonner';
import { isPublickey } from '../lib/isPublickey';
import { SimplifiedProgramInfo } from '../hooks/useProgram';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { waitForConfirmation } from '../lib/transactionConfirmation';
import { useBuffer } from '../hooks/useBuffer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '../components/ui/dialog';

type CreateProgramUpgradeInputProps = {
  programInfos: SimplifiedProgramInfo;
  transactionIndex: number
};

const CreateProgramUpgradeInput = ({
  programInfos,
  transactionIndex,
}: CreateProgramUpgradeInputProps) => {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const walletModal = useWalletModal();

  const [votingDays, setVotingDays] = useState<string>('');
  const [deadlineError, setDeadlineError] = useState('');
  const [bufferAddress, setBufferAddress] = useState('');
  const [spillAddress, setSpillAddress] = useState('');
  const [showBufferDialog, setShowBufferDialog] = useState(false);

  const { connection, multisigVault, multisigAddress } = useMultisigData();
  const { data: bufferInfo, refetch: refetchBuffer } = useBuffer(bufferAddress);

  const parseVotingDeadline = (): bigint | null => {
    const days = Number(votingDays);
    if (isNaN(days) || days <= 0) {
      setDeadlineError('Voting period must be > 0');
      return null;
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now + BigInt(days * 24 * 60 * 60);
  };

  const handleCreateUpgrade = async () => {
    if (!bufferAddress || !spillAddress || !votingDays) return;

    // If buffer authority is not vault, open dialog
    if (bufferInfo?.authority !== multisigVault?.toString()) {
      setShowBufferDialog(true);
      return;
    }

    // Proceed if vault owns buffer
    await changeUpgradeAuth();
  };

  const handleVerifyAuthority = async () => {
    await refetchBuffer();
    if (bufferInfo?.authority === multisigVault?.toString()) {
      setShowBufferDialog(false); // auto-close if vault owns buffer
    }
  };
  const changeUpgradeAuth = async () => {
    if (!wallet.publicKey) {
      walletModal.setVisible(true);
      throw 'Wallet not connected';
    }
    if (!multisigVault) {
      throw 'Multisig vault not found';
    }
    if (!multisigAddress) {
      throw 'Multisig not found';
    }
    setDeadlineError('');
    const votingDeadline = parseVotingDeadline();
    if (!votingDeadline) throw 'Invalid voting deadline';
    const vaultAddress = new PublicKey(multisigVault);
    const multisigPda = new PublicKey(multisigAddress);
    const upgradeData = Buffer.alloc(4);
    upgradeData.writeInt32LE(3, 0);

    const keys: AccountMeta[] = [
      {
        pubkey: new PublicKey(programInfos.programDataAddress),
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: new PublicKey(programInfos.programAddress),
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: new PublicKey(bufferAddress),
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: new PublicKey(spillAddress),
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isWritable: false,
        isSigner: false,
      },
      {
        pubkey: SYSVAR_CLOCK_PUBKEY,
        isWritable: false,
        isSigner: false,
      },
      {
        pubkey: vaultAddress,
        isWritable: false,
        isSigner: true,
      },
    ];

    const blockhash = (await connection.getLatestBlockhash()).blockhash;

    const transactionMessage = new TransactionMessage({
      instructions: [
        new TransactionInstruction({
          programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
          data: upgradeData,
          keys,
        }),
      ],
      payerKey: new PublicKey(vaultAddress),
      recentBlockhash: blockhash,
    });

    const transactionIndexBN = BigInt(transactionIndex);

    const proposalIx = await multisig_ixs.proposalCreate({
      multisigPda,
      creator: wallet.publicKey,
      ephemeralSigners: 0,
      votingDeadline: votingDeadline,
      transactionMessage,
      transactionIndex: transactionIndexBN,
      addressLookupTableAccounts: [],
    });

    const approveIx = await multisig_ixs.proposalApprove({
      multisigPda,
      member: wallet.publicKey,
      transactionIndex: transactionIndexBN,
    });

    const message = new TransactionMessage({
      instructions: [proposalIx, approveIx],
      payerKey: wallet.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
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
    setVotingDays('');
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buffer Address"
        value={bufferAddress}
        onChange={(e) => setBufferAddress(e.target.value)}
      />
      <Input
        placeholder="Buffer Refund / Spill Address"
        value={spillAddress}
        onChange={(e) => setSpillAddress(e.target.value)}
      />
      <Input
        placeholder="Voting period (days)"
        type="number"
        min={1}
        value={votingDays}
        onChange={(e) => { setVotingDays(e.target.value); setDeadlineError(''); }}
      />
      {deadlineError && <p className="text-xs text-red-500">{deadlineError}</p>}

      <Button onClick={handleCreateUpgrade}>Create Upgrade</Button>

      <Dialog open={showBufferDialog} onOpenChange={setShowBufferDialog}>
        <DialogContent className="max-w-lg w-full bg-background dark:bg-background-dark border border-yellow-400 p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-yellow-800 dark:text-yellow-200">Buffer Authority Not Vault</DialogTitle>
            <DialogDescription className="text-yellow-700 dark:text-yellow-300">
              The buffer authority is not the vault. Set the buffer authority to the vault before creating the upgrade.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-muted-foreground text-sm mb-1">Current Buffer Authority</p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2 overflow-x-auto">
              <code className="font-mono text-sm break-all">
                {bufferInfo?.authority || 'Unknown'}
              </code>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-muted-foreground text-sm mb-1">Set vault as buffer authority using:</p>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-3 overflow-x-auto">
              <code className="font-mono text-xs break-all">
                {`solana program set-buffer-authority ${bufferAddress} --new-buffer-authority ${multisigVault}`}
              </code>
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBufferDialog(false)}>Cancel</Button>
            <Button onClick={handleVerifyAuthority}>Verify Authority</Button>
          </DialogFooter>

          <DialogClose />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateProgramUpgradeInput;