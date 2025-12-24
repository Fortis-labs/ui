import { PublicKey, AccountInfo, ParsedAccountData, RpcResponseAndContext } from '@solana/web3.js';
import { useSuspenseQuery } from '@tanstack/react-query';
import invariant from 'invariant';
import { useMultisigData } from '../hooks/useMultisigData';

export interface BufferInfo {
    authority: string;
}

export const useBuffer = (bufferAddress: string | null, options?: { enabled?: boolean }) => {
    const { connection } = useMultisigData();

    const fetchBufferAuthority = async (bufferAddr: PublicKey): Promise<string> => {
        const accountInfo = await connection.getAccountInfo(bufferAddr);
        if (!accountInfo) throw new Error(`Buffer account ${bufferAddr.toBase58()} not found`);
        if (accountInfo.data.length < 37) throw new Error('Buffer account data too short');

        const authBytes = accountInfo.data.slice(5, 37);
        return new PublicKey(authBytes).toBase58();
    };

    return useSuspenseQuery({
        queryKey: ['bufferAuthority', bufferAddress],
        queryFn: async (): Promise<BufferInfo | null> => {
            if (!bufferAddress) return null;
            const authority = await fetchBufferAuthority(new PublicKey(bufferAddress));
            return { authority };
        },

    });
};