import { TokenList } from '../components/TokenList';
import { VaultDisplayer } from '../components/VaultDisplayer';
import { useMultisigData } from '../hooks/useMultisigData';
import { ChangeMultisig } from '../components/ChangeMultisig';
import { FortisInfo } from './FortisInfo';
import { NetworkSelector } from './NetworkSelector';
import { useMultisig } from '../hooks/useServices';
import { useMultisigAddress } from '../hooks/useMultisigAddress';
import { useEffect } from 'react';
import { useState } from 'react';

// ============================================
// ENHANCED OVERVIEW
// ============================================
export default function Overview() {
  const { multisigAddress } = useMultisigData();
  const { data: multisig } = useMultisig();
  const { setMultisigAddress } = useMultisigAddress();
  const [showNotFound, setShowNotFound] = useState(false);

  useEffect(() => {
    if (multisigAddress && multisig === null) {
      setShowNotFound(true);
      const timer = setTimeout(() => {
        setMultisigAddress.mutate(null);
        setShowNotFound(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowNotFound(false);
    }
  }, [multisigAddress, multisig, setMultisigAddress]);

  if (showNotFound) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block p-6 rounded-lg border-2 border-destructive bg-destructive/10">
          <p className="text-destructive font-semibold text-lg mb-2">
            ⚠️ Multisig not found on this network
          </p>
          <p className="text-sm text-muted-foreground font-mono break-all">
            {multisigAddress}
          </p>
        </div>
      </div>
    );
  }

  if (multisig) {
    return (
      <main className="relative space-y-6">
        <FortisInfo />
        <TokenList multisigPda={multisigAddress!} />
      </main>
    );
  }

  return null;
}