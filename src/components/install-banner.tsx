"use client";

import { useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBudget } from "@/lib/store";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function subscribe() {
  return () => undefined;
}

function bannerMode() {
  return isIos() && !isStandalone() ? "show" : "hide";
}

export function InstallBanner() {
  const { dismissedInstall, dismissInstall } = useBudget();
  const mode = useSyncExternalStore(subscribe, bannerMode, () => "hide");
  const show = !dismissedInstall && mode === "show";

  if (!show) return null;

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-primary/20 bg-primary/8 px-3 py-3 text-sm">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Share className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">На экран «Домой»</p>
          <p className="mt-0.5 text-muted-foreground">
            Нажмите «Поделиться», затем «На экран „Домой“» — приложение откроется как нативное.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-11"
          onClick={dismissInstall}
          aria-label="Скрыть"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
