// Regex: 2-3 litery (prefix) + 2-5 znaków alfanumerycznych
const PL_PLATE_REGEX = /^[A-Z]{2,3}[A-Z0-9]{2,5}$/;

// Mapowanie cyfr na podobne litery (korekta błędów OCR)
const DIGIT_TO_LETTER: Record<string, string> = {
  "0": "O",
  "1": "L",
  "2": "Z",
  "4": "A",
  "5": "S",
  "6": "G",
  "7": "Z",
  "8": "B",
  "9": "G",
};


export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function extractPrefix(plate: string): string {
  const normalized = normalizePlate(plate);
  // if (normalized.length >= 7) {
  //   return normalized.slice(0, normalized.length - 5);
  // }
  const match = normalized.match(/^([A-Z]{1,3})/);
  return match ? match[1] : "";
}

/**
 * Formatuje tablicę do wyświetlenia (prefix + spacja + reszta)
 */
export function formatPlate(plate: string): string {
  const normalized = normalizePlate(plate);
  // if (normalized.length >= 7) {
  //   const prefix = normalized.slice(0, normalized.length - 5);
  //   const rest = normalized.slice(normalized.length - 5);
  //   return `${prefix} ${rest}`;
  // }
  return normalized;
}

/**
 * Waliduje i poprawia tekst OCR do formatu polskiej tablicy.
 * Zwraca poprawiony numer lub null jeśli nie pasuje.
 */
export function validateAndCorrectPlate(text: string): string | null {
  const cleaned = normalizePlate(text);
  if (PL_PLATE_REGEX.test(cleaned)) return cleaned;

  // Korekta cyfr w prefiksie (muszą być litery)
  for (const prefLen of [2, 3]) {
    if (cleaned.length <= prefLen) continue;
    const prefix = cleaned.slice(0, prefLen);
    const rest = cleaned.slice(prefLen);
    const corrected = prefix.replace(/\d/g, (d) => DIGIT_TO_LETTER[d] || d);
    if (PL_PLATE_REGEX.test(corrected + rest)) return corrected + rest;
  }
  return null;
}
