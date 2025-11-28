import PocketBase from 'pocketbase';
import type { DistrictInfo } from '@/data/plates';

// Lazy-initialized PocketBase client so we don't lock to env at module-load time.
let pbClient: any | null = null;

function getPBClient() {
  if (pbClient) return pbClient;
  const url = (import.meta.env.VITE_POCKETBASE_URL as string) || '';
  if (!url) {
    // Nothing to do here; caller should fallback to local dataset.
    console.debug('[pocketbase] VITE_POCKETBASE_URL not set, skipping PocketBase lookup');
    return null;
  }
  try {
    pbClient = new PocketBase(url);
    console.debug('[pocketbase] initialized client for', url);
    return pbClient;
  } catch (err) {
    console.error('[pocketbase] failed to initialize client', err);
    pbClient = null;
    return null;
  }
}

/**
 * Znajduje wpis w kolekcji `plates` wg prefiksu (używa PocketBase SDK)
 * Zwraca DistrictInfo lub null
 */
export async function findDistrictByPrefixPB(prefixRaw: string): Promise<DistrictInfo | null> {
  console.debug('[pocketbase] findDistrictByPrefixPB called with', prefixRaw);
  const pb = getPBClient();
  if (!pb) return null;

  const normalized = prefixRaw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = normalized.match(/^([A-Z]{1,3})/);
  if (!m) return null;

  // próbujemy dopasować od najdłuższego prefiksu (3) do najkrótszego (1)
  for (let len = Math.min(3, m[1].length); len >= 1; len--) {
    const prefix = m[1].substring(0, len);
    try {
      console.debug('[pocketbase] querying prefix', prefix);
      // getFirstListItem rzuca, jeśli brak pasujących rekordów
      const rec = await pb.collection('plates').getFirstListItem(`prefix = "${prefix}"`);
      if (rec) {
        const info: DistrictInfo = {
          prefix: rec.prefix ?? prefix,
          district: rec.district ?? rec.name ?? 'Nieznany',
          voivodeship: rec.voivodeship ?? rec.region ?? 'Nieznane',
          postalCode: rec.postalCode ?? rec.postal_code ?? null,
        };
        console.debug('[pocketbase] found record for', prefix, info);
        return info;
      }
    } catch (err) {
      // brak rekordu lub błąd - spróbuj krótszy prefiks
      // Loguj tylko w trybie deweloperskim — przydatne przy debugowaniu
      console.debug('[pocketbase] no record for', prefix);
      continue;
    }
  }

  return null;
}
