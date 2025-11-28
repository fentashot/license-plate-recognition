import { CheckCircle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlateResult } from "@/services/ocr-service";
import { type DistrictInfo } from "@/data/plates";
import { extractPrefix } from "@/lib/plate-utils";
import PocketBase from "pocketbase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  result: PlateResult;
}

export default function PlateResult({ result }: Props) {
  const [district, setDistrict] = useState<DistrictInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    const plate = result.plate;
    if (!plate) return;

    (async () => {
      const pbUrl = (import.meta.env.VITE_POCKETBASE_URL as string) || "";
      if (!pbUrl) return;

      try {
        const pb = new PocketBase(pbUrl);
        const prefix = extractPrefix(plate);
        if (!prefix) return;

        // Próbuj od najdłuższego do najkrótszego prefixu
        for (let len = Math.min(3, prefix.length); len >= 1; len--) {
          const subPrefix = prefix.substring(0, len);
          try {
            const rec = await pb
              .collection("plates")
              .getFirstListItem(`prefix = "${subPrefix}"`);
            if (rec && mounted) {
              setDistrict({
                prefix: rec.prefix ?? subPrefix,
                district: rec.district ?? rec.name ?? "Nieznany",
                voivodeship: rec.voivodeship ?? rec.region ?? "Nieznane",
                postalCode: rec.postalCode ?? rec.postal_code ?? null,
              });
              break;
            }
          } catch {
            continue;
          }
        }
      } catch {
        // ignore pb errors
      }
    })();

    return () => { mounted = false; };
  }, [result.plate]);

  if (!result.plate) {
    return null;
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex items-center gap-2">
        <CheckCircle className="w-6 h-6 text-green-500" />
        <span className="text-2xl font-bold font-mono tracking-wider">
          {result.plate}
        </span>
        {result.confidence && (
          <span className="text-sm text-gray-400">{result.confidence}%</span>
        )}
      </CardHeader>

      {district && (
        <CardContent className="flex items-start gap-2 rounded-lg">
          <MapPin className="w-6 h-6 text-blue-500 mt-0.5" />
          <div>
            <p className="font-semibold text-lg">{district.district}</p>
            <p className=" text-gray-500">{district.voivodeship}</p>
            {district.postalCode && (
              <p className="text-sm text-gray-400">
                Kod: {district.postalCode}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
