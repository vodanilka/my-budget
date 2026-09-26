"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ExpenseForm } from "@/components/expense-form";
import { ErrorBanner, ScreenSkeleton } from "@/components/states";
import { drawDemoReceipt, recognizeReceipt } from "@/lib/ocr";
import { useBudget } from "@/lib/store";
import type { Expense } from "@/lib/types";

type Phase = "live" | "preview" | "ocr" | "confirm";

export function ScanScreen() {
  const { ready, addExpense } = useBudget();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("live");
  const [photo, setPhoto] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Expense> | null>(null);
  const [open, setOpen] = useState(false);
  const [camNonce, setCamNonce] = useState(0);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    let cancelled = false;
    const video = videoRef.current;

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      })
      .catch(() => {
        if (cancelled) return;
        const message = navigator.mediaDevices?.getUserMedia
          ? "Нет доступа к камере. На iPhone: Настройки → Safari → Камера. Можно загрузить снимок из Фото."
          : "Камера недоступна в этом браузере. Загрузите фото или откройте демо-чек.";
        setCameraError(message);
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [phase, stopCamera, camNonce]);

  function captureFromVideo() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Камера ещё не готова");
      return;
    }
    const canvas = document.createElement("canvas");
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropW = vw * 0.86;
    const cropH = Math.min(vh * 0.78, cropW * 1.45);
    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setPhoto(url);
    setPhase("preview");
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      stopCamera();
      setPhoto(String(reader.result));
      setPhase("preview");
    };
    reader.readAsDataURL(file);
  }

  function useDemo() {
    stopCamera();
    setPhoto(drawDemoReceipt());
    setPhase("preview");
  }

  async function runOcr() {
    if (!photo) return;
    setPhase("ocr");
    setProgress(0.05);
    setError(null);
    try {
      const fields = await recognizeReceipt(photo, setProgress);
      if (!fields.amount && !fields.merchant) {
        throw new Error("Не удалось прочитать сумму и магазин. Поправьте кадр или введите вручную.");
      }
      setDraft({
        date: fields.date ?? undefined,
        amount: fields.amount ?? undefined,
        description: fields.merchant,
        category: fields.category ?? "Food & Groceries",
        type: fields.type ?? "Personal",
        whoBuy: "Danil",
        forWho: fields.type === "Business" ? "Danil" : "Both",
        source: "receipt",
        receiptImage: photo,
        free: false,
        card: null,
      });
      setPhase("confirm");
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR не сработал");
      setPhase("preview");
    }
  }

  if (!ready) return <ScreenSkeleton />;

  return (
    <div className="relative min-h-[calc(100dvh-6rem)] bg-zinc-950 text-white">
      {phase === "live" ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="absolute inset-0 bg-black/35" />
          <div
            className="pointer-events-none absolute inset-x-[7%] rounded-[28px] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{ top: "18%", bottom: "28%" }}
          >
            <span className="absolute top-2 left-2 size-8 rounded-tl-xl border-t-4 border-l-4 border-white" />
            <span className="absolute top-2 right-2 size-8 rounded-tr-xl border-t-4 border-r-4 border-white" />
            <span className="absolute bottom-2 left-2 size-8 rounded-bl-xl border-b-4 border-l-4 border-white" />
            <span className="absolute bottom-2 right-2 size-8 rounded-br-xl border-b-4 border-r-4 border-white" />
          </div>
          <div
            className="absolute inset-x-0 top-0 px-4"
            style={{ paddingTop: "max(0.9rem, env(safe-area-inset-top))" }}
          >
            <h1 className="text-lg font-semibold">Скан чека</h1>
            <p className="text-sm text-white/80">
              Поместите чек в рамку. Распознаем сумму, дату и магазин и запишем в Expenses.
            </p>
          </div>
          {cameraError ? (
            <div className="absolute inset-x-4 top-28">
              <ErrorBanner
                message={cameraError}
                onRetry={() => {
                  setCameraError(null);
                  setCamNonce((n) => n + 1);
                }}
              />
            </div>
          ) : null}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-around px-6"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <label className="flex size-14 cursor-pointer flex-col items-center justify-center rounded-full bg-white/15">
              <ImagePlus className="size-6" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>
            <button
              type="button"
              onClick={captureFromVideo}
              className="flex size-[72px] items-center justify-center rounded-full border-4 border-white bg-white/20"
              aria-label="Снять"
            >
              <span className="size-14 rounded-full bg-white" />
            </button>
            <button
              type="button"
              onClick={useDemo}
              className="flex size-14 flex-col items-center justify-center rounded-full bg-white/15"
              aria-label="Демо-чек"
            >
              <Sparkles className="size-6" />
            </button>
          </div>
        </>
      ) : null}

      {(phase === "preview" || phase === "ocr") && photo ? (
        <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
          <div
            className="px-4"
            style={{ paddingTop: "max(0.9rem, env(safe-area-inset-top))" }}
          >
            <h1 className="text-lg font-semibold">
              {phase === "ocr" ? "Читаем чек…" : "Проверьте кадр"}
            </h1>
            <p className="text-sm text-white/75">
              Если текст кривой — переснимите. Дальше разберём сумму и магазин.
            </p>
          </div>
          {error ? <ErrorBanner message={error} onRetry={runOcr} /> : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt="Чек"
            className="mx-auto mt-4 max-h-[52dvh] rounded-2xl object-contain"
          />
          {phase === "ocr" ? (
            <div className="mx-8 mt-6">
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm text-white/80">
                OCR {Math.round(progress * 100)}%
              </p>
            </div>
          ) : (
            <div className="mt-auto flex gap-2 px-4 py-6">
              <Button
                variant="secondary"
                className="h-12 flex-1"
                onClick={() => {
                  setPhoto(null);
                  setPhase("live");
                }}
              >
                <RotateCcw className="size-4" />
                Переснять
              </Button>
              <Button className="h-12 flex-1" onClick={runOcr}>
                <Camera className="size-4" />
                Распознать
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {phase === "confirm" && photo ? (
        <div className="bg-background text-foreground">
          <div
            className="px-4 pb-2"
            style={{ paddingTop: "max(0.9rem, env(safe-area-inset-top))" }}
          >
            <h1 className="text-lg font-semibold">Чек распознан</h1>
            <p className="text-sm text-muted-foreground">
              Проверьте поля и запишите в ту же модель, что и лист Expenses.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Чек" className="mx-auto max-h-40 rounded-xl object-contain" />
        </div>
      ) : null}

      <Drawer
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setPhase("live");
        }}
        showSwipeHandle
      >
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader>
            <DrawerTitle>Записать чек</DrawerTitle>
            <DrawerDescription>
              Категории только из Lists. После сохранения сумма попадёт в обзор месяца.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {draft ? (
              <ExpenseForm
                initial={draft}
                submitLabel="В бюджет"
                onCancel={() => {
                  setOpen(false);
                  setPhase("preview");
                }}
                onSubmit={(row) => {
                  addExpense({ ...row, source: "receipt", receiptImage: photo });
                  setOpen(false);
                  setPhoto(null);
                  setPhase("live");
                }}
              />
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
