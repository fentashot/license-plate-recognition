import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

import ImageUpload from '@/components/ImageUpload';
import PlateResult from '@/components/PlateResult';
import { recognizePlate, type PlateResult as PlateResultType } from '@/services/ocr-service';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlateResultType | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileSelect(file: File) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));

    try {
      const plateResult = await recognizePlate(file);
      setResult(plateResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Rozpoznawanie tablicy zew. API</h1>

      <div className="space-y-6">
        {/* Upload */}
        <ImageUpload onFileSelect={handleFileSelect} disabled={isLoading} />

        {/* Preview */}
        {preview && (
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <img src={preview} alt="Podgląd" className="w-full" />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-3 p-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Rozpoznawanie...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && <PlateResult result={result} />}
      </div>
    </div>
  );
}
