import React, { FC, useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import { useNetwork } from '../hooks/useNetwork';
interface WalletProps {
    children: ReactNode;
}
export const Wallet: FC<WalletProps> = ({ children }) => {

    return (
        <WalletProvider wallets={[]} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
    );
};