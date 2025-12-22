import { useMemo } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import * as multisig_pda from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/pda';
import { useRpcUrl, useProgramId } from './useSettings';
import { useMultisigAddress } from './useMultisigAddress';
import * as multisig from '@sqds/multisig';

export const useMultisigData = () => {
  // Fetch settings from React Query hooks
  const { rpcUrl } = useRpcUrl();
  const { programId: storedProgramId } = useProgramId();
  const { multisigAddress } = useMultisigAddress();


  // Ensure we have a valid RPC URL (fallback to mainnet-beta)
  const effectiveRpcUrl = rpcUrl || clusterApiUrl('mainnet-beta');
  const connection = useMemo(() => new Connection(effectiveRpcUrl), [effectiveRpcUrl]);

  // Compute programId safely
  const programId = useMemo(
    () => (storedProgramId ? new PublicKey(storedProgramId) : multisig.PROGRAM_ID),
    [storedProgramId]
  );

  // Compute the multisig vault PDA
  const multisigVault = useMemo(() => {
    if (multisigAddress) {
      const pda = multisig_pda.getVaultPda({
        multisigPda: new PublicKey(multisigAddress),
      });
      return pda[0];
    }
    return null;
  }, [multisigAddress, programId]);
  return {
    rpcUrl: effectiveRpcUrl,
    connection,
    multisigAddress,
    programId,
    multisigVault,
  };
};