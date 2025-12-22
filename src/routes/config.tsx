import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import * as multisig from '/home/mubariz/Documents/SolDev/fortis_repos/client/ts/generated';
import { useMultisigData } from '../hooks/useMultisigData';
import { useMultisig } from '../hooks/useServices';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Suspense } from 'react';

const ConfigurationPage = () => {
  const { rpcUrl, multisigAddress, programId } = useMultisigData();
  const { data: multisigConfig } = useMultisig();

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <h1 className="mb-4 text-3xl font-bold">Multisig Configuration</h1>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                List of members in the multisig.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {multisigConfig &&
                  multisigConfig.members.map((member) => (
                    <div key={member.key.toBase58()}>
                      <p className="text-sm font-medium">
                        Public Key: {member.key.toBase58()}
                      </p>
                      <hr className="mt-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {multisigConfig && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Threshold</CardTitle>
              </CardHeader>
              <CardContent>
                <span>Current Threshold: {multisigConfig.threshold}</span>
              </CardContent>
            </Card>
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};
export default ConfigurationPage;