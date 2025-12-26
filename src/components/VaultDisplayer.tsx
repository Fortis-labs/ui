'use client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { VaultSelector } from './VaultSelector';
import { useMultisigData } from '../hooks/useMultisigData';

type VaultDisplayerProps = {};

export function VaultDisplayer({ }: VaultDisplayerProps) {
  const { multisigVault: vaultAddress, multisigAddress } = useMultisigData();

  return (
    <Card className="w-fit my-3 border-gradient hover:glow-primary transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-gradient flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-[hsl(200,95%,58%)] to-[hsl(210,90%,52%)] animate-pulse"></span>
          Fortis Vault
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-xs text-muted-foreground mb-1">Address</p>
          <p className="text-sm font-mono break-all">{vaultAddress?.toBase58()}</p>
        </div>
        <VaultSelector />
      </CardContent>
    </Card>
  );
}