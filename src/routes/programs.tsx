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
        // Authority matches — no dialog, just ready for actions
        setShowDialog(false);
      } else {
        // Open dialog
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

      setProgramInfos(info); // update globally

      if (info.authority === vaultAddressStr) {
        // ✅ Now owned by vault — close dialog and show action cards
        setShowDialog(false);
      } else {
        // ❌ Still not owned — update dialog content
        setCurrentAuthority(info.authority);
        // Dialog stays open automatically
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

              {/* Show program info if available (even in dialog) */}
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

              {/* Action cards — only if vault is authority AND dialog is closed */}
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
          <Dialog open={showDialog} onOpenChange={(open) => {
            if (!open) {
              setShowDialog(false);
              // optionally clear state, but we keep programInfos for info
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Program Not Managed by Fortis</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  The current upgrade authority is not the Fortis vault.
                </p>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Upgrade Authority</p>
                  <p className="font-mono text-sm break-all bg-muted p-2 rounded">
                    {currentAuthority || 'Unknown'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transfer authority using:</p>
                  <pre className="text-xs font-mono bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {`solana program set-upgrade-authority ${validatedProgramId} \\
--new-upgrade-authority ${vaultAddressStr} \\
--skip-new-upgrade-authority-signer-check`}
                  </pre>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={isLoading}
                >
                  Close
                </Button>
                <Button
                  onClick={handleVerifyAuthority}
                  disabled={isLoading}
                >
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