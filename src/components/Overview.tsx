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
export default function Overview() {
  const { multisigAddress } = useMultisigData();
  const { data: multisig } = useMultisig();
  const { setMultisigAddress } = useMultisigAddress();
  const [showNotFound, setShowNotFound] = useState(false);

  useEffect(() => {
    if (multisigAddress && multisig === null) {
      // Show message
      setShowNotFound(true);

      // Clear after 2 seconds
      const timer = setTimeout(() => {
        setMultisigAddress.mutate(null);
        setShowNotFound(false);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowNotFound(false);
    }
  }, [multisigAddress, multisig, setMultisigAddress]);

  // Show "not found" temporarily
  if (showNotFound) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive font-medium">Multisig not found on this network</p>
        <p className="text-sm text-muted-foreground mt-1">{multisigAddress}</p>
      </div>
    );
  }

  // Only render cards if multisig exists
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