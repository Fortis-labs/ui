import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import SendTokens from './SendTokensButton';
import SendSol from './SendSolButton';
import { useMultisigData } from '../hooks/useMultisigData';
import { useBalance, useGetTokens } from '../hooks/useServices';
import DepositSol from './DepositSolButton';
import { AssetOption } from './DepositDialog';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  DepositDialog

} from './DepositDialog';
import { WithdrawDialog } from './WithdrawDialog';
type TokenListProps = {
  multisigPda: string;
};
interface ParsedTokenAccount {
  mint: string;
  tokenAmount: {
    uiAmount: number;
    amount: string;
    decimals: number;
  };
}
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function TokenList({ multisigPda }: TokenListProps) {
  const { programId, multisigVault } = useMultisigData();
  const { publicKey } = useWallet();
  const { data: solBalance = 0 } = useBalance(multisigVault);
  const { data: tokens = null } = useGetTokens(multisigVault);
  const { data: usersolBalance = 0 } = useBalance(publicKey);
  const { data: usertokens = null } = useGetTokens(publicKey);
  const isParsedTokenAccount = (data: any): data is { parsed: { info: ParsedTokenAccount; type: string } } => {
    return (
      data &&
      data.parsed &&
      data.parsed.info &&
      typeof data.parsed.info.mint === 'string' &&
      data.parsed.info.tokenAmount &&
      typeof data.parsed.info.tokenAmount.uiAmount === 'number' &&
      typeof data.parsed.info.tokenAmount.decimals === 'number'
    );
  };
  const assetOptions: AssetOption[] = [];
  const userassetOptions: AssetOption[] = [];

  // Add SOL (only if vault exists)
  if (multisigVault) {
    assetOptions.push({
      mint: SOL_MINT,
      balance: solBalance ? solBalance / LAMPORTS_PER_SOL : 0,
      decimals: 9,
      tokenAccount: undefined,
    });
  }
  if (publicKey) {
    userassetOptions.push({
      mint: SOL_MINT,
      balance: usersolBalance ? usersolBalance / LAMPORTS_PER_SOL : 0,
      decimals: 9,
      tokenAccount: undefined,
    });
  }

  // Add SPL tokens
  if (tokens) {
    for (const token of tokens) {
      if (isParsedTokenAccount(token.account.data)) {
        const info = token.account.data.parsed.info;
        if (info.mint === SOL_MINT) continue; // 🔥 Skip SOL
        assetOptions.push({
          mint: info.mint,
          balance: info.tokenAmount.uiAmount ?? 0,
          decimals: info.tokenAmount.decimals,
          tokenAccount: token.pubkey.toBase58(),
        });
      }
    }
  }
  // Add SPL tokens
  if (usertokens) {
    for (const token of usertokens) {
      if (isParsedTokenAccount(token.account.data)) {
        const info = token.account.data.parsed.info;
        if (info.mint === SOL_MINT) continue; // 🔥 Skip SOL
        userassetOptions.push({
          mint: info.mint,
          balance: info.tokenAmount.uiAmount ?? 0,
          decimals: info.tokenAmount.decimals,
          tokenAccount: token.pubkey.toBase58(),
        });
      }
    }
  }
  console.log("num of user assets", userassetOptions.length);
  console.log("num of vault assets", assetOptions.length);

  return (
    <Card className="hover:shadow-[0_8px_24px_hsla(200,95%,58%,0.12)] transition-all duration-300">
      <CardHeader className="flex flex-row flex-wrap justify-between items-start gap-4">
        <div>
          <CardTitle className="text-gradient text-2xl">Tokens</CardTitle>
          <CardDescription>The tokens you hold in your wallet</CardDescription>
        </div>
        <div className="flex gap-2">
          <DepositDialog
            multisigPda={multisigPda}
            assetOptions={userassetOptions}
          />
          <WithdrawDialog
            multisigPda={multisigPda}
            assetOptions={assetOptions}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* SOL Balance */}
          <div className="p-4 rounded-lg border border-border">
            <div className="space-y-1">
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-br from-[hsl(200,95%,58%)] to-[hsl(210,90%,52%)]"></span>
                SOL
              </p>
              <p className="text-sm text-muted-foreground">
                Amount: {solBalance ? (solBalance / LAMPORTS_PER_SOL).toFixed(4) : 0}
              </p>
            </div>
          </div>

          {/* Token List */}
          {tokens && tokens.length > 0 && (
            <div className="space-y-4">
              <div className="divider-gradient"></div>
              {tokens.map((token) => {
                const info = token.account.data.parsed.info;
                return (
                  <div
                    key={info.mint}
                    className="p-4 rounded-lg border border-border"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">
                        Mint: {info.mint}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amount: {info.tokenAmount.uiAmount ?? 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}