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
const queryClient = new QueryClient();

const App = () => {
  return (
    <NetworkProvider>
      <QueryClientProvider client={queryClient}>
        <Wallet>
          <HashRouter>
            <Routes>
              {/* Landing page route - no TabNav */}
              <Route path="/landing" element={<FortisignLanding />} />

              {/* Main app routes - with TabNav and sidebar */}
              <Route path="/*" element={
                <div className="dark flex h-screen min-w-full flex-col bg-background md:flex-row">
                  <Suspense>
                    <TabNav />
                  </Suspense>
                  <div className="mt-1 space-y-2 p-3 pb-24 pt-4 md:ml-auto md:w-9/12 md:space-y-4 md:p-8 md:pt-6">
                    <ErrorBoundary fallback={<p>Something went wrong.</p>}>
                      <Suspense fallback={<p>Loading...</p>}>
                        <Routes>
                          <Route path="/landing" element={<FortisignLanding />} />
                          <Route index element={<HomePage />} />
                          <Route path="/create" element={<CreatePage />} />
                          <Route path="/transactions" element={<TransactionsPage />} />FortisignL
                          <Route path="/programs" element={<ProgramsPage />} />
                          <Route path="*" element={<p>404 - Not Found</p>} />
                        </Routes>
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </div>
              } />
            </Routes>
            <Toaster expand visibleToasts={3} />
          </HashRouter>
        </Wallet>
      </QueryClientProvider>
    </NetworkProvider>
  );
};

export default App;