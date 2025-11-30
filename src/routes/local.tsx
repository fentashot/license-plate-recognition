import ImageUpload from "@/components/ImageUpload";
import PlateResult from "@/components/PlateResult";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createFileRoute } from "@tanstack/react-router";
import { useLocalOCR } from "@/hooks/useLocalOCR";

export const Route = createFileRoute("/local")({
  component: () => (
    <ProtectedRoute>
      <LocalOCRPage />
    </ProtectedRoute>
  ),
});

function LocalOCRPage() {
  const { preview, debugPreview, plate, loading, progress, error, handleFile } =
    useLocalOCR();

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Lokalne rozpoznawanie tablicy</h1>

      <ImageUpload onFileSelect={handleFile} disabled={loading} />

      <section className="grid grid-cols-2 gap-4">
        {preview && (
          <div className="mb-4">
            <p className="text-xs text-gray-400">Oryginał:</p>
            <img
              src={preview}
              alt="Oryginalna tablica"
              className="w-full rounded border"
            />
          </div>
        )}

        {debugPreview && (
          <div className="mb-4">
            <p className="text-xs text-gray-400">Przetworzony:</p>
            <img
              src={debugPreview}
              alt="Przetworzony obraz"
              className="w-full rounded border bg-black"
            />
            <a
              href={debugPreview}
              download="debug.png"
              className="text-xs text-blue-500 underline"
            >
              Pobierz
            </a>
          </div>
        )}
      </section>

      {loading && (
        <div className="mb-4 space-y-2">
          <p className="text-blue-500 font-medium">Przetwarzanie... {progress}%</p>
          <div className="w-full bg-gray-200 rounded h-3">
            <div
              className="bg-blue-500 h-3 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-600">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {plate && (
        <div className="mt-4">
          <PlateResult result={{ plate, confidence: undefined, region: null }} />
        </div>
      )}
    </div>
  );
}
