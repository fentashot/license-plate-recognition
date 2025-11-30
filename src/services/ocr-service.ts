/**
 * Serwis rozpoznawania tablic rejestracyjnych
 * Używa Plate Recognizer API (https://platerecognizer.com)
 */

const API_KEY = import.meta.env.VITE_PLATE_RECOGNIZER_API_KEY || "";
const API_URL = "https://api.platerecognizer.com/v1/plate-reader/";

export interface PlateResult {
  plate: string | null;
  confidence?: number;
  region?: string | null;
}

/**
 * Rozpoznaje tablicę rejestracyjną ze zdjęcia
 */
export async function recognizePlate(file: File): Promise<PlateResult> {
  if (!API_KEY) {
    throw new Error(
      "Brak klucza API. Ustaw VITE_PLATE_RECOGNIZER_API_KEY w .env",
    );
  }

  const formData = new FormData();
  formData.append("upload", file);
  formData.append("regions", "pl");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Token ${API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Nieprawidłowy klucz API");
    if (response.status === 403) throw new Error("Przekroczono limit API");
    throw new Error(`Błąd API: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results?.length) {
    return { plate: null, confidence: 0, region: null };
  }

  const result = data.results[0];
  return {
    plate: formatPlate(result.plate),
    confidence: Math.round(result.score * 100),
    region: result.region?.code || null,
  };
}

/**
 * Formatuje numer tablicy (dodaje spację)
 */
function formatPlate(plate: string): string {
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 5) return clean;

  const prefixLen = clean[2]?.match(/[A-Z]/) ? 3 : 2;
  return `${clean.slice(0, prefixLen)} ${clean.slice(prefixLen)}`;
}
