import { useMultisig } from './useServices';
import { useWallet } from '@solana/wallet-adapter-react';
import { isMember } from '../lib/utils';
import { PublicKey } from '@solana/web3.js';

export const useAccess = () => {
  const { data: multisig } = useMultisig();
  const { publicKey } = useWallet();
  if (!multisig || !publicKey) {
    return false;
  }
  const members = multisig.members.map((addr) => new PublicKey(addr));
  const memberExists = isMember(publicKey, members);
  return !!memberExists;
};