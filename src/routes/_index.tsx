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