import SetProgramIdInput from '../components/SetProgramIdInput';
import SetRpcUrlInput from '../components/SetRpcUrlnput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import SetExplorerInput from '../components/SetExplorerInput';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Suspense } from 'react';
const SettingsPage = () => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <main className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Application-level configuration
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle>RPC URL</CardTitle>
                <CardDescription>
                  Change the default RPC endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SetRpcUrlInput />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Program ID</CardTitle>
                <CardDescription>
                  Targeted multisig program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SetProgramIdInput />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur md:col-span-2">
              <CardHeader>
                <CardTitle>Explorer</CardTitle>
                <CardDescription>
                  Select preferred blockchain explorer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SetExplorerInput />
              </CardContent>
            </Card>
          </div>
        </main>
      </Suspense>
    </ErrorBoundary>
  );
};

export default SettingsPage;
