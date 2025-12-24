import { Button } from './ui/button';
import { Input } from './ui/input';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useState, useEffect, useRef } from 'react';
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
import { useDebounce } from 'use-debounce';
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
const CreateProgramUpgradeInput = ({ programInfos, transactionIndex }: CreateProgramUpgradeInputProps) => {
  const queryClient = useQueryClient();
  const wallet = useWallet();
  const { connection, multisigVault, multisigAddress } = useMultisigData();

  const [bufferAddress, setBufferAddress] = useState('');
  const [spillAddress, setSpillAddress] = useState('');
  const [votingDays, setVotingDays] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const [showBufferDialog, setShowBufferDialog] = useState(false);
  const [currentAuthority, setCurrentAuthority] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; }
  }, []);

  const parseVotingDeadline = (): bigint | null => {
    const days = Number(votingDays);
    if (isNaN(days) || days <= 0) {
      setDeadlineError('Voting period must be > 0');
      return null;
    }
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now + BigInt(days * 24 * 60 * 60);
  };

  const getBufferAuthority = async (address: string) => {
    const info = await connection.getAccountInfo(new PublicKey(address));
    if (!info) throw new Error('Buffer not found');
    if (info.data.length < 37) throw new Error('Buffer data too short');
    return new PublicKey(info.data.slice(5, 37)).toBase58();
  };

  const handleCreateUpgrade = async () => {
    if (!bufferAddress || !spillAddress || !votingDays) return;

    try {
      const authority = await getBufferAuthority(bufferAddress);

      if (authority !== multisigVault?.toString()) {
        if (mountedRef.current) {
          setCurrentAuthority(authority);
          setShowBufferDialog(true);
        }
        return;
      }

      await performUpgrade();
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch buffer authority');
    }
  };

  const handleVerifyAuthority = async () => {
    if (!bufferAddress) return;

    try {
      const authority = await getBufferAuthority(bufferAddress);
      if (!mountedRef.current) return;

      setCurrentAuthority(authority);

      if (authority === multisigVault?.toString()) {
        setShowBufferDialog(false);
        await performUpgrade();
      } else {
        toast('Buffer authority is still not vault');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify buffer authority');
    }
  };

  const performUpgrade = async () => {
    if (!wallet.publicKey || !multisigVault || !multisigAddress) throw new Error('Missing wallet or multisig');

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
      instructions: [new TransactionInstruction({
        programId: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
        data: upgradeData,
        keys,
      })],
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
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    toast.success('Upgrade proposal created successfully!');
  };

  return (
    <div className="space-y-3">
      <Input placeholder="Buffer Address" value={bufferAddress} onChange={(e) => setBufferAddress(e.target.value)} />
      <Input placeholder="Spill Address" value={spillAddress} onChange={(e) => setSpillAddress(e.target.value)} />
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
        <DialogContent className="max-w-lg w-full p-6 rounded-lg border border-yellow-400 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-yellow-800">Buffer Authority Not Vault</DialogTitle>
            <DialogDescription className="text-yellow-700">
              The buffer authority is not the vault. Set the buffer authority to the vault before creating the upgrade.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm mb-1">Current Buffer Authority</p>
            <div className="rounded-md bg-neutral-900 p-2 overflow-x-auto">
              <code className="font-mono text-sm text-neutral-100 break-all">
                {currentAuthority || 'Unknown'}
              </code>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm mb-1">Set vault as buffer authority using:</p>

            <div className="rounded-md bg-neutral-900 p-3 overflow-x-auto border border-neutral-700">
              <code className="block font-mono text-xs text-neutral-100 break-all">
                solana program set-buffer-authority {bufferAddress} --new-buffer-authority {multisigVault?.toString()}
              </code>
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBufferDialog(false)}>Cancel</Button>
            <Button onClick={handleVerifyAuthority}>Verify</Button>
          </DialogFooter>

          <DialogClose />
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default CreateProgramUpgradeInput;