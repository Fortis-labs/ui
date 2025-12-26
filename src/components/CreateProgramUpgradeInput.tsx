import { Button } from './ui/button';
import { Input } from './ui/input';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useState, useEffect, useRef } from 'react';
import { getAddressDecoder } from '@solana/kit';
import { Card, CardContent, CardTitle } from './ui/card';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import * as multisig_ixs from '../../client/ts/instructions';
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
import { useDebounce } from 'use-debounce';
import { isPublickey } from '../lib/isPublickey';
import { SimplifiedProgramInfo } from '../hooks/useProgram';
import { useMultisigData } from '../hooks/useMultisigData';
import { useQueryClient } from '@tanstack/react-query';
import { waitForConfirmation } from '../lib/transactionConfirmation';

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
  const { connection, multisigVault, multisigAddress, rpcUrl } = useMultisigData();
  const [isLoading, setIsLoading] = useState(false);
  const [bufferError, setBufferError] = useState('');
  const [bufferAddress, setBufferAddress] = useState('');
  const [spillAddress, setSpillAddress] = useState('');
  const [votingDays, setVotingDays] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const [showBufferDialog, setShowBufferDialog] = useState(false);
  const [currentAuthority, setCurrentAuthority] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Cleanup ref
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, [rpcUrl]);

  // ✅ Clear form when network changes
  useEffect(() => {
    setBufferAddress('');
    setSpillAddress('');
    setVotingDays('');
    setBufferError('');
    setDeadlineError('');
  }, [rpcUrl]);

  const parseVotingDeadline = (): bigint | null => {
    const days = Number(votingDays);
    if (isNaN(days) || days <= 0) {
      setDeadlineError('Voting period must be > 0');
      return null;
    }
    setDeadlineError('');
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now + BigInt(days * 24 * 60 * 60);
  };

  const getBufferAuthority = async (address: string) => {
    const pubkey = new PublicKey(address);
    const info = await connection.getAccountInfo(pubkey);
    if (!info) {
      throw new Error('Buffer account not found');
    }
    if (info.data.length < 37) {
      throw new Error('Buffer data too short');
    }

    return new PublicKey(info.data.slice(5, 37)).toBase58();
  };

  const performUpgrade = async () => {
    if (!wallet.publicKey || !multisigVault || !multisigAddress)
      throw new Error('Missing wallet or multisig');

    setDeadlineError('');
    const votingDeadline = parseVotingDeadline();
    if (!votingDeadline) return;

    const vault = new PublicKey(multisigVault);
    const multisigPda = new PublicKey(multisigAddress);

    const upgradeData = Buffer.alloc(4);
    upgradeData.writeInt32LE(3, 0);

    const keys = [
      { pubkey: new PublicKey(programInfos.programDataAddress), isWritable: true, isSigner: false },
      { pubkey: new PublicKey(programInfos.programAddress), isWritable: true, isSigner: false },
      { pubkey: new PublicKey(bufferAddress), isWritable: true, isSigner: false },
      { pubkey: new PublicKey(spillAddress), isWritable: true, isSigner: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isWritable: false, isSigner: false },
      { pubkey: vault, isWritable: false, isSigner: true },
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
      payerKey: vault,
      recentBlockhash: blockhash,
    });

    const transactionIndexBN = BigInt(transactionIndex);

    const proposalIx = await multisig_ixs.proposalCreate({
      multisigPda,
      creator: wallet.publicKey,
      ephemeralSigners: 0,
      votingDeadline,
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

    const tx = new VersionedTransaction(message);
    const sig = await wallet.sendTransaction(tx, connection, { skipPreflight: true });

    toast.loading('Confirming...', { id: 'tx' });
    const sent = await waitForConfirmation(connection, [sig]);
    if (!sent[0]) throw new Error(`Transaction failed: ${sig}`);

    setVotingDays('');
    await queryClient.invalidateQueries({ queryKey: ['transactions', rpcUrl] });
    toast.success('Upgrade proposal created successfully!');
  };

  const handleCreateUpgrade = async () => {
    const deadline = parseVotingDeadline();
    if (!bufferAddress || !spillAddress || !deadline) {
      if (!bufferAddress) setBufferError('Buffer address is required');
      return;
    }

    setIsLoading(true);
    setBufferError('');

    try {
      const authority = await getBufferAuthority(bufferAddress);
      if (!mountedRef.current) return;

      const vaultStr = multisigVault?.toString() || '';
      if (authority === vaultStr) {
        await performUpgrade();
      } else {
        setCurrentAuthority(authority);
        setShowBufferDialog(true);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setBufferError(err.message || 'Failed to verify buffer authority');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const handleVerifyAuthority = async () => {
    if (!bufferAddress) return;

    setIsLoading(true);
    try {
      const authority = await getBufferAuthority(bufferAddress);
      if (!mountedRef.current) return;

      const vaultStr = multisigVault?.toString() || '';
      setCurrentAuthority(authority);

      if (authority === vaultStr) {
        setShowBufferDialog(false);
        await performUpgrade();
      } else {
        setBufferError('Buffer authority is still not the vault');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setBufferError(err.message || 'Verification failed');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buffer Address"
        value={bufferAddress}
        onChange={(e) => {
          setBufferAddress(e.target.value)
          setBufferError(''); // clear on change
        }}
      />
      {bufferError && <p className="text-xs text-red-500">{bufferError}</p>}
      <Input
        placeholder="Spill Address"
        value={spillAddress}
        onChange={(e) => setSpillAddress(e.target.value)}
      />
      <Input
        placeholder="Voting period (days)"
        type="number"
        min={1}
        value={votingDays}
        onChange={(e) => {
          setVotingDays(e.target.value);
          setDeadlineError('');
        }}
      />
      {deadlineError && <p className="text-xs text-red-500">{deadlineError}</p>}

      <Button onClick={handleCreateUpgrade} disabled={isLoading} className="w-full">
        Create Upgrade
      </Button>
      {/* Buffer Authority Verification Dialog */}
      <Dialog open={showBufferDialog} onOpenChange={(open) => !open && setShowBufferDialog(false)}>
        <DialogContent className="max-w-lg w-full p-6 rounded-lg border border-yellow-400/50 bg-background shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-yellow-800 dark:text-yellow-200">
              Buffer Not Managed by Fortis
            </DialogTitle>
            <DialogDescription className="text-yellow-700 dark:text-yellow-300">
              The current buffer authority is not the Fortis vault.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm mb-1 text-foreground">Current Buffer Authority</p>
            <div className="rounded-md bg-muted p-2 overflow-x-auto font-mono text-sm break-all">
              {currentAuthority || 'Unknown'}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm mb-1 text-foreground">Transfer authority using:</p>
            <div className="rounded-md bg-muted p-3 overflow-x-auto border border-muted-foreground/20">
              <code className="block font-mono text-xs break-all">{`solana program set-buffer-authority ${bufferAddress}
--new-buffer-authority ${multisigVault?.toString()}`}</code>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBufferDialog(false)}
              disabled={isLoading}
            >
              Close
            </Button>
            <Button onClick={handleVerifyAuthority} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateProgramUpgradeInput;