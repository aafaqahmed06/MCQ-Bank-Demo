import DkBot from "@/components/DkBot";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-card border border-border-default bg-surface-elevated p-8 text-center shadow-elevated">
        <div className="flex justify-center">
          <DkBot state="concerned" size="medium" alt={null} />
        </div>
        <p className="mt-4 text-caption font-semibold tracking-widest text-primary uppercase">
          404
        </p>
        <h1 className="mt-2 text-h2 font-bold text-text-primary">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Button href="/home" className="mt-6">
          Go home
        </Button>
      </div>
    </div>
  );
}
