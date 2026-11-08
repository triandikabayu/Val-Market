"use client";

import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="border border-line bg-surface p-6">
      <p role="alert" className="text-sm text-danger">
        {message}
      </p>
      <Button variant="secondary" onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  );
}
