'use client';
import CreateFortisForm from '../components/CreateFortisForm';
import { Card, CardContent } from '../components/ui/card';
import { ErrorBoundary } from '../components/ErrorBoundary';

const CreateFortis = () => {
  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Create a Fortis</h1>
          <p className="text-base text-muted-foreground">
            Create a Fortis and set it as your default account.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <CreateFortisForm />
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};
export default CreateFortis;