
import { getMultisigDecoder, getProposalDecoder } from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import * as multisig_pda from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/pda';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMultisigData } from './useMultisigData';
import { useMultisigAddress } from './useMultisigAddress';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
export function useUpgradeBufferAuthority(
    bufferAddress: string | null
) {
    const { connection, multisigVault, rpcUrl } = useMultisigData();
    return useSuspenseQuery({
        queryKey: ['bufferAuthority', bufferAddress, rpcUrl],
        queryFn: async () => {
            if (!bufferAddress || !multisigVault) return null;

            const acc = await connection.getAccountInfo(
                new PublicKey(bufferAddress)
            );
            if (!acc) return null;

            // BPF Upgradeable Loader layout:
            // authority offset = 5..37
            const authority = new PublicKey(
                acc.data.slice(5, 37)
            ).toBase58();

            return {
                authority,
                isVaultAuthority: authority === multisigVault.toBase58(),
            };
        },
    });
}
