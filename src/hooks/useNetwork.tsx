import { createContext, useContext, useState, ReactNode } from 'react';
import { useMemo } from 'react';
export type Network = 'mainnet' | 'devnet' | 'custom';

// ✅ Fixed: no trailing spaces
const MAINNET_RPC = 'https://mainnet.helius-rpc.com/?api-key=64096058-650d-4e15-99cd-842c236765ef';
const DEVNET_RPC = 'https://devnet.helius-rpc.com/?api-key=64096058-650d-4e15-99cd-842c236765ef';

export function resolveRpc(network: Network, customRpc?: string): string {
    if (network === 'custom' && customRpc) {
        try {
            new URL(customRpc);
            return customRpc;
        } catch {
            return DEVNET_RPC; // safe fallback
        }
    }
    return network === 'devnet' ? DEVNET_RPC : MAINNET_RPC;
}

interface NetworkContextType {
    network: Network;
    setNetwork: (n: Network) => void;
    customRpc: string;
    setCustomRpc: (r: string) => void;
    rpcUrl: string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
    const [network, setNetwork] = useState<Network>('devnet');
    const [customRpc, setCustomRpc] = useState('');

    const rpcUrl = useMemo(() => resolveRpc(network, customRpc), [network, customRpc]);

    return (
        <NetworkContext.Provider value={{ network, setNetwork, customRpc, setCustomRpc, rpcUrl }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (!context) throw new Error('useNetwork must be used within NetworkProvider');
    return context;
};
export const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};