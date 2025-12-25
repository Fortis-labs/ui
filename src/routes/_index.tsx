import RenderMultisigRoute from '../components/RenderMultisigRoute';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Suspense } from 'react';

const Index = () => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <RenderMultisigRoute />
      </Suspense>
    </ErrorBoundary>
  );
};

export default Index;
/*
 curl 'https://rpc.ironforge.network/devnet?apiKey=01HXY5BNJRYXRW05J6NE9YFQ3M'   -H 'content-type: application/json'   -H 'origin: https://dashboard.nosana.com'   -H 'referer: https://dashboard.nosana.com/'   --data-raw '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAccountInfo",
    "params": [
      "AnVeXDCZabs3qCJwCrZ4uwdDEGnwFBTqFwszChSsormJ",
      {
        "encoding": "jsonParsed",
        "commitment": "confirmed"
      }
    ]
  }' | jq

*/