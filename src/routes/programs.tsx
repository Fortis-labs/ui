import ChangeUpgradeAuthorityInput from '../components/ChangeUpgradeAuthorityInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { address, type Address } from '@solana/kit';
import { PublicKey, BPF_LOADER_PROGRAM_ID } from '@solana/web3.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { useMultisig } from '../hooks/useServices';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Suspense, useState, useEffect, useRef } from 'react';
import { SimplifiedProgramInfo } from '../hooks/useProgram';
import CreateProgramUpgradeInput from '../components/CreateProgramUpgradeInput';
import { useMultisigData } from '../hooks/useMultisigData';

const ProgramsPage = () => {
  const { data: multisigConfig } = useMultisig();
  const { connection, multisigVault: vaultAddress } = useMultisigData();

  const [programIdInput, setProgramIdInput] = useState('');
  const [programIdError, setProgramIdError] = useState('');
  const [validatedProgramId, setValidatedProgramId] = useState<string | null>(null);
  const [programInfos, setProgramInfos] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [currentAuthority, setCurrentAuthority] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mountedRef = useRef(true);
  const vaultAddressStr = vaultAddress?.toString() ?? null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getSimplifiedProgramInfos = async (programId: string): Promise<any> => {
    if (!programId) throw new Error('Program ID is required');
    const programIdPk = new PublicKey(programId);

    const info = await connection.getAccountInfo(programIdPk);
    if (!info) throw new Error(`Program account not found: ${programId}`);

    const [programDataAddress] = PublicKey.findProgramAddressSync(
      [programIdPk.toBytes()],
      new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111')
    );

    const programDataAccount = await connection.getAccountInfo(programDataAddress);
    if (!programDataAccount) {
      throw new Error(`Program data account not found for: ${programId}`);
    }

    const authorityPubkey = new PublicKey(programDataAccount.data.subarray(13, 45));
    return {
      programAddress: programId,
      programDataAddress: programDataAddress.toString(),
      authority: authorityPubkey.toBase58(),
    };
  };

  const validateProgramId = async () => {
    const input = programIdInput.trim();
    setProgramIdError('');

    if (!input) {
      setProgramIdError('Program ID is required');
      return;
    }

    try {
      new PublicKey(input); // format check
    } catch {
      setProgramIdError('Invalid Program ID format');
      return;
    }

    setIsLoading(true);
    try {
      const info = await getSimplifiedProgramInfos(input);
      if (!mountedRef.current) return;

      setValidatedProgramId(input);
      setProgramInfos(info);

      if (info.authority === vaultAddressStr) {
        setShowDialog(false);
      } else {
        setCurrentAuthority(info.authority);
        setShowDialog(true);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setProgramIdError(err.message || 'Failed to fetch program data');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const handleVerifyAuthority = async () => {
    if (!validatedProgramId) return;

    setIsLoading(true);
    try {
      const info = await getSimplifiedProgramInfos(validatedProgramId);
      if (!mountedRef.current) return;

      setProgramInfos(info);

      if (info.authority === vaultAddressStr) {
        setShowDialog(false);
      } else {
        setCurrentAuthority(info.authority);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify authority');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  const clearProgramId = () => {
    setProgramIdInput('');
    setValidatedProgramId(null);
    setProgramInfos(null);
    setProgramIdError('');
    setShowDialog(false);
  };

  const isVaultAuthority = programInfos?.authority === vaultAddressStr;

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Program Manager</h1>

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
                    disabled={isLoading}
                  />
                  {programIdError && (
                    <p className="mt-1 text-sm text-red-500">{programIdError}</p>
                  )}
                </div>

                <Button onClick={validateProgramId} disabled={isLoading}>
                  {isLoading ? 'Validating...' : 'Validate'}
                </Button>

                {validatedProgramId && (
                  <Button variant="outline" onClick={clearProgramId} disabled={isLoading}>
                    Clear
                  </Button>
                )}
              </div>

              {programInfos && !showDialog && (
                <Card className="border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Program Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Program Data Address</p>
                      <p className="font-mono break-all">{programInfos.programDataAddress}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Upgrade Authority</p>
                      <p className="font-mono break-all">{programInfos.authority}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {validatedProgramId && isVaultAuthority && !showDialog && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Upgrade Authority</CardTitle>
                      <CardDescription>
                        Change the upgrade authority of this program.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChangeUpgradeAuthorityInput
                        programInfos={programInfos}
                        transactionIndex={Number(multisigConfig?.transactionIndex || 0) + 1}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Upgrade Program</CardTitle>
                      <CardDescription>
                        Deploy a new program version.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CreateProgramUpgradeInput
                        programInfos={programInfos}
                        transactionIndex={Number(multisigConfig?.transactionIndex || 0) + 1}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Authority Verification Dialog */}
          <Dialog open={showDialog} onOpenChange={(open) => !open && setShowDialog(false)}>
            <DialogContent className="max-w-lg w-full p-6 rounded-lg border border-yellow-400/50 bg-background shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-yellow-800 dark:text-yellow-200">
                  Program Not Managed by Fortis
                </DialogTitle>
                <DialogDescription className="text-yellow-700 dark:text-yellow-300">
                  The current upgrade authority is not the Fortis vault.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <p className="text-sm mb-1 text-foreground">Current Upgrade Authority</p>
                <div className="rounded-md bg-muted p-2 overflow-x-auto font-mono text-sm break-all">
                  {currentAuthority || 'Unknown'}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm mb-1 text-foreground">Transfer authority using:</p>
                <div className="rounded-md bg-muted p-3 overflow-x-auto border border-muted-foreground/20">
                  <code className="block font-mono text-xs break-all">{`solana program set-upgrade-authority ${validatedProgramId}
--new-upgrade-authority ${vaultAddressStr} 
--skip-new-upgrade-authority-signer-check`}</code>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isLoading}
                >
                  Close
                </Button>
                <Button onClick={handleVerifyAuthority} disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default ProgramsPage;