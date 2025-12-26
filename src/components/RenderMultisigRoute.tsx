import MultisigInput from './MultisigInput';
import { useMultisigData } from '../hooks/useMultisigData';
import Overview from '../components/Overview';
import MultisigLookup from './MultisigLookup';
import NetworkSelector from './NetworkSelector';
interface RenderRouteProps {
  children: React.ReactNode;
}

// Main Route Component
export default function RenderMultisigRoute() {
  const { multisigAddress } = useMultisigData();

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <NetworkSelector />
      </div>

      {multisigAddress ? <Overview /> : (
        <>
          <MultisigInput onUpdate={() => null} />
          <MultisigLookup onUpdate={() => null} />
        </>
      )}
    </div>
  );
}