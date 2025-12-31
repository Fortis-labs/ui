import React, { Suspense } from 'react';
import { Wallet } from './components/Wallet';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckSquare } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import TabNav from './components/TabNav';

import HomePage from './routes/_index';
import CreatePage from './routes/create';
import TransactionsPage from './routes/transactions';
import ProgramsPage from './routes/programs';
import { Routes, Route, HashRouter } from 'react-router-dom';

import './styles/global.css'; // ✅ Load Tailwind styles
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkProvider } from './hooks/useNetwork';
import FortisignLanding from './routes/landing';
import { Helmet } from "react-helmet";
const queryClient = new QueryClient();
const App = () => {
  return (
    <>
      <Helmet>
        <title>Fortis — Secure Solana Multisig Without Blind Signing</title>
        <meta
          name="description"
          content="Fortis is a security-first Solana multisig designed to protect DAOs and treasuries from blind signing, address poisoning, and high-stake exploits."
        />
      </Helmet>

      <div>
        <h1>Secure Solana Multisig for High-Stake Treasuries</h1>
        <p>Fortis is a security-first multisig wallet built on Solana...</p>
      </div>

      <NetworkProvider>
        <QueryClientProvider client={queryClient}>
          <Wallet>
            <HashRouter>
              <Routes>
                <Route path="/" element={<FortisignLanding />} />
                <Route path="/landing" element={<FortisignLanding />} />
                <Route
                  path="/*"
                  element={
                    <div className="dark flex h-screen min-w-full flex-col bg-background md:flex-row">
                      <Suspense>
                        <TabNav />
                      </Suspense>
                      <div className="mt-1 space-y-2 p-3 pb-24 pt-4 md:ml-auto md:w-9/12 md:space-y-4 md:p-8 md:pt-6">
                        <ErrorBoundary fallback={<p>Something went wrong.</p>}>
                          <Suspense fallback={<p>Loading...</p>}>
                            <Routes>
                              <Route index element={<HomePage />} />
                              <Route path="home" element={<HomePage />} />
                              <Route path="create" element={<CreatePage />} />
                              <Route path="transactions" element={<TransactionsPage />} />
                              <Route path="programs" element={<ProgramsPage />} />
                              <Route path="*" element={<p>404 - Not Found</p>} />
                            </Routes>
                          </Suspense>
                        </ErrorBoundary>
                      </div>
                    </div>
                  }
                />
              </Routes>
              <Toaster expand visibleToasts={3} />
            </HashRouter>
          </Wallet>
        </QueryClientProvider>
      </NetworkProvider>
    </>
  );
};

export default App;
