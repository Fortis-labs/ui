import * as multisig from '@sqds/multisig';
import { useMultisig } from './useServices';
import { useWallet } from '@solana/wallet-adapter-react';
import { isMember } from '@/lib/utils';

export const useAccess = () => {
  const { data: multisig } = useMultisig();
  const { publicKey } = useWallet();
  if (!multisig || !publicKey) {
    return false;
  }
  // if the pubkeyKey is in members return true
  const memberExists = isMember(publicKey, multisig.members);
  // return true if found
  return !!memberExists;
};