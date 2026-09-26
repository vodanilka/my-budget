import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ScreenSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-36 w-full rounded-3xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-4 mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
      <p className="font-medium text-destructive">Не получилось</p>
      <p className="mt-0.5 text-destructive/90">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-2 min-h-11 text-sm font-medium underline underline-offset-4"
          onClick={onRetry}
        >
          Повторить
        </button>
      ) : null}
    </div>
  );
}
