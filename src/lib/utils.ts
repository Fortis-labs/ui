import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as multisig from '../../client/ts/generated';
import { PublicKey } from '@solana/web3.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
}


export const isMember = (publicKey: PublicKey, members: PublicKey[]) => {
  return members.find((v: PublicKey) => v.equals(publicKey));
};