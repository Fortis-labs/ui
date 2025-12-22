import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
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
  // if the pubkeyKey is in members return true
  //cast Adress[] to PublicKey[]
  const members = multisig.members.map((addr) => new PublicKey(addr.toString()));
  const memberExists = isMember(publicKey, members);
  // return true if found
  return !!memberExists;
};