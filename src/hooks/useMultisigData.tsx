import { useMemo } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import * as multisig_pda from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/pda';
import { resolveRpc } from './useNetwork';
import { useProgramId } from './useSettings';
import { useMultisigAddress } from './useMultisigAddress';
import { useNetwork } from './useNetwork';

export const useMultisigData = () => {
  // Fetch settings from React Query hooks
  const { network, customRpc } = useNetwork();

  const rpcUrl = resolveRpc(network, customRpc);
  const { programId: storedProgramId } = useProgramId();
  const { multisigAddress } = useMultisigAddress();
  // Ensure we have a valid RPC URL (fallback to mainnet-beta)
  const effectiveRpcUrl = rpcUrl || clusterApiUrl('mainnet-beta');
  const connection = useMemo(() => new Connection(effectiveRpcUrl), [effectiveRpcUrl]);
  // Compute programId safely
  const programId = useMemo(
    () => (new PublicKey(storedProgramId)),
    [storedProgramId]
  );

  // Compute the multisig vault PDA
  const multisigVault = useMemo(() => {
    if (!multisigAddress) return null;

    try {
      const pda = multisig_pda.getVaultPda({ multisigPda: new PublicKey(multisigAddress) });
      return pda[0];
    } catch {
      return null;
    }
  }, [multisigAddress, programId]);
  return {
    rpcUrl: effectiveRpcUrl,
    connection,
    multisigAddress,
    programId,
    multisigVault,
  };
};