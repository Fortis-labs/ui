
import { useMultisigData } from './useMultisigData';
import { useSuspenseQuery } from '@tanstack/react-query';
import { type AccountInfo, type ParsedAccountData, PublicKey, type RpcResponseAndContext } from '@solana/web3.js';
import invariant from 'invariant';

export interface SimplifiedProgramInfo {
  programAddress: string;
  programDataAddress: string;
  authority: string;
}
