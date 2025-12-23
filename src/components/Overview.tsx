import { TokenList } from '../components/TokenList';
import { VaultDisplayer } from '../components/VaultDisplayer';
import { useMultisigData } from '../hooks/useMultisigData';
import { ChangeMultisig } from '../components/ChangeMultisig';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
export default function Overview() {
  const { multisigAddress, programId } = useMultisigData();

  const [votingDeadlineInput, setVotingDeadlineInput] = useState('');
  const [votingDeadline, setVotingDeadline] = useState<bigint | null>(null);
  const [votingDeadlineError, setVotingDeadlineError] = useState('');

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold mb-4">Overview</h1>

        {/* Voting deadline input */}
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">Voting Deadline (Unix timestamp, seconds)</label>
          <Input
            placeholder="e.g. 1735689600"
            value={votingDeadlineInput}
            onChange={(e: any) => setVotingDeadlineInput(e.target.value)}
            className={votingDeadlineError ? 'border-red-500' : ''}
          />
          {votingDeadlineError && <p className="text-sm text-red-500">{votingDeadlineError}</p>}
          <Button
            variant="outline"
            onClick={() => {
              setVotingDeadlineError('');
              if (!votingDeadlineInput.trim()) {
                setVotingDeadlineError('Voting deadline is required');
                return;
              }
              try {
                const deadline = BigInt(votingDeadlineInput);
                const now = BigInt(Math.floor(Date.now() / 1000));
                if (deadline <= now) {
                  setVotingDeadlineError('Deadline must be in the future');
                  return;
                }
                setVotingDeadline(deadline);
              } catch {
                setVotingDeadlineError('Invalid integer value');
              }
            }}
          >
            Set Voting Deadline
          </Button>
          {votingDeadline && (
            <p className="text-xs text-muted-foreground">
              UTC: {new Date(Number(votingDeadline) * 1000).toUTCString()}
            </p>
          )}
        </div>

        {multisigAddress && <VaultDisplayer />}
        {multisigAddress && <ChangeMultisig />}

        {/* Only show TokenList if votingDeadline is set */}
        {multisigAddress && votingDeadline && (
          <TokenList multisigPda={multisigAddress} votingDeadline={votingDeadline} />
        )}
      </div>
    </main>
  );
}