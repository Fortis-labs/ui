'use client';
import CreateFortisForm from '../components/createFortisForm';
import { Card, CardContent } from '../components/ui/card';
import { ErrorBoundary } from '../components/ErrorBoundary';

const CreateFortis = () => {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Fortis</h1>
          <p className="text-sm text-muted-foreground">
            Create a new multisig and set it as default
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardContent className="pt-6">
            <CreateFortisForm />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};
export default CreateFortis;