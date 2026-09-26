import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Button, ErrorBanner, ScreenSkeleton, Sheet } from "../components/ui";
import { ExpenseForm } from "../components/expense-form";
import { recognizeDemoReceipt } from "../lib/ocr";
import { useBudget } from "../lib/store";
import type { Expense } from "../lib/types";
import { colors } from "../theme";

type Phase = "live" | "preview" | "ocr" | "confirm";

export function ScanScreen() {
  const { ready, addExpense } = useBudget();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("live");
  const [photo, setPhoto] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Expense> | null>(null);
  const [open, setOpen] = useState(false);

  if (!ready) return <ScreenSkeleton />;

  async function capture() {
    try {
      const shot = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      if (!shot?.uri) {
        setError("Камера ещё не готова");
        return;
      }
      setDemo(false);
      setPhoto(shot.uri);
      setPhase("preview");
    } catch {
      setError("Не удалось снять кадр");
    }
  }

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    setDemo(false);
    setPhoto(res.assets[0].uri);
    setPhase("preview");
  }

  function useDemo() {
    setDemo(true);
    setPhoto(null);
    setPhase("preview");
  }

  function runOcr() {
    setPhase("ocr");
    setProgress(0.2);
    setError(null);
    setTimeout(() => {
      try {
        if (!demo && photo) {
          setDraft({
            source: "receipt",
            receiptImage: photo,
            whoBuy: "Danil",
            forWho: "Both",
            type: "Personal",
            category: "Food & Groceries",
            free: false,
            card: null,
          });
          setProgress(1);
          setPhase("confirm");
          setOpen(true);
          return;
        }
        const fields = recognizeDemoReceipt();
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
        setProgress(1);
        setPhase("confirm");
        setOpen(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "OCR не сработал");
        setPhase("preview");
      }
    }, 450);
  }

  return (
    <View style={styles.page}>
      {phase === "live" ? (
        <>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          ) : (
            <View style={styles.noCam}>
              <Text style={styles.whiteTitle}>Нет доступа к камере</Text>
              <Text style={styles.whiteSub}>
                На iPhone: Настройки → Expo Go → Камера. Можно загрузить снимок из Фото или открыть демо-чек.
              </Text>
              <Button label="Разрешить камеру" onPress={() => requestPermission()} />
            </View>
          )}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame} />
          </View>
          <View style={styles.topCopy}>
            <Text style={styles.whiteTitle}>Скан чека</Text>
            <Text style={styles.whiteSub}>
              Поместите чек в рамку. Распознаем сумму, дату и магазин и запишем в Expenses.
            </Text>
          </View>
          {error ? (
            <View style={{ paddingHorizontal: 16, marginTop: 120 }}>
              <ErrorBanner message={error} />
            </View>
          ) : null}
          <View style={styles.controls}>
            <Pressable style={styles.round} onPress={pickFromLibrary} accessibilityLabel="Галерея">
              <Ionicons name="image-outline" size={24} color="#fff" />
            </Pressable>
            <Pressable style={styles.shutter} onPress={capture} accessibilityLabel="Снять">
              <View style={styles.shutterInner} />
            </Pressable>
            <Pressable style={styles.round} onPress={useDemo} accessibilityLabel="Демо-чек">
              <Ionicons name="sparkles-outline" size={24} color="#fff" />
            </Pressable>
          </View>
        </>
      ) : null}

      {(phase === "preview" || phase === "ocr") ? (
        <View style={styles.preview}>
          <Text style={styles.whiteTitle}>
            {phase === "ocr" ? "Читаем чек…" : "Проверьте кадр"}
          </Text>
          <Text style={styles.whiteSub}>
            {demo
              ? "Демо-чек WinCo: распознаем сумму $47.82, дату и магазин."
              : "Живое фото прикрепим к операции — сумму и магазин проверьте вручную. Для авто-OCR откройте демо-чек (звёздочка)."}
          </Text>
          {error ? <ErrorBanner message={error} onRetry={runOcr} /> : null}
          {demo ? (
            <View style={styles.demoCard}>
              <Text style={styles.demoStore}>WINCO FOODS</Text>
              <Text style={styles.demoLine}>PORTLAND, OR</Text>
              <Text style={styles.demoLine}>03/15/2026  TOTAL $47.82</Text>
              <Text style={styles.demoLine}>BANANAS · MILK · EGGS · CHICKEN</Text>
            </View>
          ) : photo ? (
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="contain" />
          ) : null}
          {phase === "ocr" ? (
            <View style={{ marginTop: 20 }}>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.whiteSub}>OCR {Math.round(progress * 100)}%</Text>
            </View>
          ) : (
            <View style={styles.previewBtns}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Переснять"
                  variant="secondary"
                  onPress={() => {
                    setPhoto(null);
                    setDemo(false);
                    setPhase("live");
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Распознать" onPress={runOcr} />
              </View>
            </View>
          )}
        </View>
      ) : null}

      {phase === "confirm" && !open ? (
        <View style={styles.preview}>
          <Text style={styles.whiteTitle}>Чек распознан</Text>
          <Text style={styles.whiteSub}>
            Проверьте поля и запишите в ту же модель, что и лист Expenses.
          </Text>
        </View>
      ) : null}

      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setPhase("live");
        }}
        title="Записать чек"
        description="Категории только из Lists. После сохранения сумма попадёт в обзор месяца."
      >
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
              setDemo(false);
              setPhase("live");
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#09090B" },
  noCam: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  frame: {
    width: "86%",
    height: "52%",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  topCopy: { position: "absolute", top: 16, left: 16, right: 16 },
  whiteTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  whiteSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4, lineHeight: 20 },
  controls: {
    position: "absolute",
    bottom: 28,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  preview: { flex: 1, padding: 16, paddingTop: 20 },
  photo: { width: "100%", height: 320, marginTop: 16, borderRadius: 16 },
  demoCard: {
    marginTop: 24,
    backgroundColor: "#F7F4EE",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  demoStore: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  demoLine: { fontSize: 13, color: "#333" },
  track: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: "#fff" },
  previewBtns: { marginTop: "auto", flexDirection: "row", gap: 8, paddingBottom: 16 },
});
