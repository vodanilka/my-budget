"use client";

import { ErrorBanner } from "@/components/states";

export default function ErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
      <ErrorBanner
        message={error.message || "Страница не открылась"}
        onRetry={reset}
      />
    </div>
  );
}
