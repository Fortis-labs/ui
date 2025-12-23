import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
//import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import { useMultisigData } from '../hooks/useMultisigData';
import { useMultisig } from '../hooks/useServices';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Suspense } from 'react';

const ConfigurationPage = () => {
  const { rpcUrl, multisigAddress, programId } = useMultisigData();
  const { data: multisigConfig } = useMultisig();


  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Multisig Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Manage members and threshold settings
            </p>
          </div>

          {/* Members */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Accounts participating in this multisig
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {multisigConfig?.members.map((member) => (
                <div
                  key={member}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-muted/40 px-4 py-3"
                >
                  <span className="truncate font-mono text-sm">
                    {member}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <CardTitle>Threshold</CardTitle>
                <CardDescription>Required approvals</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                {multisigConfig && (
                  <span className="text-foreground">
                    Current threshold:{" "}
                    <span className="font-semibold">
                      {multisigConfig.threshold}
                    </span>
                  </span>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};
export default ConfigurationPage;