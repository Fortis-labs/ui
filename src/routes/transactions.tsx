import { Table, TableCaption, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';
import { Suspense } from 'react';
import CreateTransaction from '../components/CreateTransactionButton';
import TransactionTable from '../components/TransactionTable';
import { useMultisig, useTransactions } from '../hooks/useServices';
import { useMultisigData } from '../hooks/useMultisigData';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const TRANSACTIONS_PER_PAGE = 10;

export default function TransactionsPage() {
  const [votingDeadlineInput, setVotingDeadlineInput] = useState('');
  const [votingDeadline, setVotingDeadline] = useState<bigint | null>(null);
  const [votingDeadlineError, setVotingDeadlineError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const pageParam = new URLSearchParams(location.search).get('page');
  let page = pageParam ? parseInt(pageParam, 10) : 1;
  if (page < 1) {
    page = 1;
  }
  const { multisigAddress, programId } = useMultisigData();

  const { data } = useMultisig();

  const totalTransactions = Number(data ? data.transactionIndex : 0);
  const totalPages = Math.ceil(totalTransactions / TRANSACTIONS_PER_PAGE);

  const startIndex = totalTransactions - (page - 1) * TRANSACTIONS_PER_PAGE;
  const endIndex = Math.max(startIndex - TRANSACTIONS_PER_PAGE + 1, 1);

  const { data: latestTransactions } = useTransactions(startIndex, endIndex);

  const transactions = (latestTransactions || []).map((transaction) => {
    return {
      ...transaction,
      transactionPda: transaction.transactionPda[0].toBase58(),
    };
  });

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading ...</div>}>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Transactions</h1>
            <div className="mb-4 space-y-2">
              <label className="text-sm font-medium">
                Voting Deadline (Unix timestamp, seconds)
              </label>

              <Input
                placeholder="e.g. 1735689600"
                value={votingDeadlineInput}
                onChange={(e) => setVotingDeadlineInput(e.target.value)}
                className={votingDeadlineError ? 'border-red-500' : ''}
              />

              {votingDeadlineError && (
                <p className="text-sm text-red-500">{votingDeadlineError}</p>
              )}

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
            {votingDeadline && (
              <CreateTransaction votingDeadline={votingDeadline} />
            )}
          </div>

          <Suspense>
            <Table>
              <TableCaption>A list of your recent transactions.</TableCaption>
              <TableCaption>
                Page: {page} of {totalPages}
              </TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead>Index</TableHead>
                  <TableHead>Transaction Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <Suspense>
                <TransactionTable
                  multisigPda={multisigAddress!}
                  transactions={transactions}
                  programId={programId!.toBase58()}
                />
              </Suspense>
            </Table>
          </Suspense>

          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationPrevious
                  size="sm"
                  onClick={() => navigate(`/transactions?page=${page - 1}`)}
                  to={`/transactions?page=${page - 1}`}
                />
              )}
              {page < totalPages && (
                <PaginationNext
                  size="sm"
                  to={`/transactions?page=${page + 1}`}
                  onClick={() => navigate(`/transactions?page=${page + 1}`)}
                />
              )}
            </PaginationContent>
          </Pagination>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
