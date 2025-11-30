import { useState, useRef, useCallback } from "react";
import { createWorker, type Worker } from "tesseract.js";
import { validateAndCorrectPlate } from "@/lib/plate-utils";
import { preprocessImage } from "@/lib/preprocess-image";

interface UseOCRState {
  preview: string | null;
  debugPreview: string | null;
  plate: string | null;
  loading: boolean;
  progress: number;
  error: string | null;
}

interface UseOCRHandlers {
  handleFile: (file: File) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for local OCR processing with Tesseract.js
 * Handles image preprocessing, worker setup, and plate recognition
 */
export function useLocalOCR(): UseOCRState & UseOCRHandlers {
  const [preview, setPreview] = useState<string | null>(null);
  const [debugPreview, setDebugPreview] = useState<string | null>(null);
  const [plate, setPlate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Initialize worker on first use
  const getWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;

    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setProgress(Math.round((m.progress || 0) * 100));
        }
      },
    });

    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      preserve_interword_spaces: "1",
    });

    workerRef.current = worker;
    return worker;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setPreview(URL.createObjectURL(file));
      setPlate(null);
      setError(null);
      setProgress(0);
      setLoading(true);

      try {
        // Preprocess image
        const { canvas, debugUrl } = await preprocessImage(file);
        setDebugPreview(debugUrl);

        // Get worker and recognize
        const worker = await getWorker();
        const { data } = await worker.recognize(canvas.toDataURL("image/png"));
        const text = (data.text || "").trim();

        if (!text) {
          setError("Nie wykryto tekstu na obrazie");
          return;
        }

        // Validate and format plate
        const validated = validateAndCorrectPlate(text);
        const formattedPlate = validated ?? text.toUpperCase().replace(/[^A-Z0-9]/g, "");
        setPlate(formattedPlate);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Błąd przetwarzania: ${message}`);
      } finally {
        setLoading(false);
      }
    },
    [getWorker]
  );

  const reset = useCallback(() => {
    setPreview(null);
    setDebugPreview(null);
    setPlate(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    preview,
    debugPreview,
    plate,
    loading,
    progress,
    error,
    handleFile,
    reset,
  };
}
