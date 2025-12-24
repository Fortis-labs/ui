import ChangeUpgradeAuthorityInput from '../components/ChangeUpgradeAuthorityInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { address, type Address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { useMultisig } from '../hooks/useServices';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Suspense, useState } from 'react';
import { useProgram } from '../hooks/useProgram';
import CreateProgramUpgradeInput from '../components/CreateProgramUpgradeInput';
import { useMultisigData } from '../hooks/useMultisigData';
const ProgramsPage = () => {
  const { data: multisigConfig } = useMultisig();
  const { multisigVault: vaultAddress } = useMultisigData();

  const [programIdInput, setProgramIdInput] = useState('');
  const [programIdError, setProgramIdError] = useState('');
  const [validatedProgramId, setValidatedProgramId] = useState<string | null>(null);

  const { data: programInfos } = useProgram(validatedProgramId);

  const vaultAddressStr = vaultAddress?.toString() ?? null;

  const isVaultAuthority =
    !!programInfos?.authority && programInfos.authority === vaultAddressStr;

  const validateProgramId = () => {
    setProgramIdError('');

    if (!programIdInput.trim()) {
      setProgramIdError('Program ID is required');
      return;
    }

    try {
      new PublicKey(programIdInput);
      setValidatedProgramId(programIdInput);
    } catch {
      setProgramIdError('Invalid Program ID format');
    }
  };

  const clearProgramId = () => {
    setProgramIdInput('');
    setValidatedProgramId(null);
    setProgramIdError('');
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Program Manager</h1>

          {/* Program ID Input */}
          <Card>
            <CardHeader>
              <CardTitle>Program</CardTitle>
              <CardDescription>
                Enter a Program ID to manage upgrades and authority using Fortis.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Program ID"
                    value={programIdInput}
                    onChange={(e) => setProgramIdInput(e.target.value)}
                    className={programIdError ? 'border-red-500' : ''}
                  />
                  {programIdError && (
                    <p className="mt-1 text-sm text-red-500">{programIdError}</p>
                  )}
                </div>

                <Button onClick={validateProgramId}>Validate</Button>

                {validatedProgramId && (
                  <Button variant="outline" onClick={clearProgramId}>
                    Clear
                  </Button>
                )}
              </div>

              {/* Program not found */}
              {validatedProgramId && !programInfos && (
                <div className="rounded-md border border-yellow-400/50 bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-200">
                  No program found with this ID or unable to fetch program data.
                </div>
              )}

              {/* Program info */}
              {validatedProgramId && programInfos && (
                <Card className="border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Program Information</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Program Data Address</p>
                      <p className="font-mono break-all">
                        {programInfos.programDataAddress}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Upgrade Authority</p>
                      <p className="font-mono break-all">
                        {programInfos.authority ?? 'Immutable'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Not managed by Fortis */}
              {validatedProgramId && programInfos && multisigConfig && !isVaultAuthority && (
                <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 dark:text-yellow-200">
                      Program Not Managed by Fortis
                    </CardTitle>
                    <CardDescription className="text-yellow-700 dark:text-yellow-300">
                      The upgrade authority is not the Fortis vault.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current Upgrade Authority</p>
                      <p className="font-mono break-all">
                        {programInfos.authority ?? 'Immutable'}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">
                        Transfer authority using:
                      </p>
                      <pre className="mt-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 p-3 text-xs font-mono text-yellow-900 dark:text-yellow-200 overflow-auto">
                        {`solana program set-upgrade-authority ${validatedProgramId} \
--new-upgrade-authority ${vaultAddress} \
--skip-new-upgrade-authority-signer-check`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {multisigConfig && programInfos && isVaultAuthority && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Change Upgrade Authority</CardTitle>
                  <CardDescription>
                    Propose a new upgrade authority for this program.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangeUpgradeAuthorityInput
                    programInfos={programInfos}
                    transactionIndex={Number(multisigConfig.transactionIndex) + 1}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upgrade Program</CardTitle>
                  <CardDescription>
                    Deploy a new program version through Fortis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreateProgramUpgradeInput
                    programInfos={programInfos}
                    transactionIndex={Number(multisigConfig.transactionIndex) + 1}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default ProgramsPage;
