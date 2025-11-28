import { CheckCircle, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PlateResult } from '@/services/ocr-service';
import { findDistrictByPlatePrefix, type DistrictInfo } from '@/data/plates';
import PocketBase from 'pocketbase';

interface Props {
  result: PlateResult;
}

export default function PlateResult({ result }: Props) {
  const [district, setDistrict] = useState<DistrictInfo | null>(
    result.plate ? findDistrictByPlatePrefix(result.plate) : null
  );

  useEffect(() => {
    let mounted = true;
    const plate = result.plate;
    if (!plate) return;

    (async () => {
      const pbUrl = (import.meta.env.VITE_POCKETBASE_URL as string) || '';
      if (!pbUrl) return; // no PB configured

      try {
        const pb = new PocketBase(pbUrl);
        const normalized = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const m = normalized.match(/^([A-Z]{1,3})/);
        if (!m) return;

        for (let len = Math.min(3, m[1].length); len >= 1; len--) {
          const prefix = m[1].substring(0, len);
          try {
            const rec = await pb.collection('plates').getFirstListItem(`prefix = "${prefix}"`);
            if (rec && mounted) {
              const info: DistrictInfo = {
                prefix: rec.prefix ?? prefix,
                district: rec.district ?? rec.name ?? 'Nieznany',
                voivodeship: rec.voivodeship ?? rec.region ?? 'Nieznane',
                postalCode: rec.postalCode ?? rec.postal_code ?? null,
              };
              setDistrict(info);
              break;
            }
          } catch (err) {
            // not found, continue trying shorter prefix
            continue;
          }
        }
      } catch (err) {
        // ignore pb errors
      }
    })();

    return () => {
      mounted = false;
    };
  }, [result.plate]);

  if (!result.plate) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
        <p className="text-yellow-700">Nie wykryto tablicy rejestracyjnej</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle className="w-6 h-6 text-green-500" />
        <span className="text-2xl font-bold font-mono tracking-wider">
          {result.plate}
        </span>
        <span className="text-sm text-gray-400">
          {result.confidence}%
        </span>
        
      </div>

      {district && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{district.district}</p>
            <p className="text-sm text-gray-500">{district.voivodeship}</p>
            {district.postalCode && (
              <p className="text-sm text-gray-400">Kod: {district.postalCode}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
