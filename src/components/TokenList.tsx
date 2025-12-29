import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import SendTokens from './SendTokensButton';
import SendSol from './SendSolButton';
import { useMultisigData } from '../hooks/useMultisigData';
import { useBalance, useGetTokens } from '../hooks/useServices';
import DepositSol from './DepositSolButton';
type TokenListProps = {
  multisigPda: string;
};

export function TokenList({ multisigPda }: TokenListProps) {
  const { programId } = useMultisigData();
  const { data: solBalance = 0 } = useBalance();
  const { data: tokens = null } = useGetTokens();

  return (
    <Card className="hover:shadow-[0_8px_24px_hsla(200,95%,58%,0.12)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-gradient text-2xl">Tokens</CardTitle>
        <CardDescription>The tokens you hold in your wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* SOL Balance with gradient accent */}
          <div className="p-4 rounded-lg border border-border hover:border-[hsl(200,95%,58%)] transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-br from-[hsl(200,95%,58%)] to-[hsl(210,90%,52%)]"></span>
                  SOL
                </p>
                <p className="text-sm text-muted-foreground">
                  Amount: {solBalance ? solBalance / LAMPORTS_PER_SOL : 0}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DepositSol multisigPda={multisigPda} />
                <SendSol multisigPda={multisigPda} />
              </div>
            </div>
          </div>

          {/* Token List with enhanced styling */}
          {tokens && tokens.length > 0 && (
            <div className="space-y-4">
              <div className="divider-gradient"></div>
              {tokens.map((token) => (
                <div
                  key={token.account.data.parsed.info.mint}
                  className="p-4 rounded-lg border border-border hover:border-[hsl(200,95%,58%)] transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Mint: {token.account.data.parsed.info.mint}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amount: {token.account.data.parsed.info.tokenAmount.uiAmount}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <SendTokens
                        mint={token.account.data.parsed.info.mint}
                        tokenAccount={token.pubkey.toBase58()}
                        decimals={token.account.data.parsed.info.tokenAmount.decimals}
                        multisigPda={multisigPda}
                        programId={programId.toBase58()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}