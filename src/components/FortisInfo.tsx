import { Button } from '../components/ui/button';
import { useMultisigAddress } from '../hooks/useMultisigAddress';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { VaultSelector } from './VaultSelector';
import { useMultisigData } from '../hooks/useMultisigData';
import { useMultisig } from '../hooks/useServices';
type FortisInfoProps = {};
export function FortisInfo({ }: FortisInfoProps) {
    const { multisigVault: vaultAddress, multisigAddress } = useMultisigData();
    const { data: multisigConfig } = useMultisig();
    const { setMultisigAddress } = useMultisigAddress();

    const handleSwitch = () => {
        setMultisigAddress.mutate(null);
    };

    if (!multisigAddress) return null;

    return (
        <Card className="my-4 max-w-xl space-y-4">
            <CardHeader>
                <CardTitle>Fortis</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Addresses */}
                <div>
                    <p className="text-sm text-muted-foreground">Multisig Address</p>
                    <p className="font-mono text-sm break-all">{multisigAddress}</p>
                </div>

                <div>
                    <p className="text-sm text-muted-foreground">Vault Address</p>
                    <p className="font-mono text-sm break-all">{vaultAddress?.toBase58()}</p>
                </div>

                {/* Members & Threshold */}
                {multisigConfig && (
                    <div className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Members</p>
                            {multisigConfig.members.map((member) => (
                                <p key={member} className="font-mono text-sm break-all">
                                    {member}
                                </p>
                            ))}
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Threshold</p>
                            <p className="font-mono text-sm">
                                {multisigConfig.threshold} / {multisigConfig.members.length}
                            </p>
                        </div>
                    </div>
                )}

                <div className="pt-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleSwitch}>
                        Switch Fortis
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}