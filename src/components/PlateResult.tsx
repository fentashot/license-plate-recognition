import { CheckCircle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlateResult } from "@/services/ocr-service";
import type { DistrictInfo } from "@/data/plates";
import { extractPrefix } from "@/lib/plate-utils";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  result: PlateResult;
}

export default function PlateResult({ result }: Props) {
  const { pb } = useAuth();
  const [district, setDistrict] = useState<DistrictInfo | null>(null);

  useEffect(() => {
    if (!result?.plate || !pb) return;

    let mounted = true;

    const lookupAndSave = async () => {
      try {
        const prefix = extractPrefix(result.plate as string);

        // Try prefix lengths from longest (3) to shortest (1)
        for (let len = Math.min(3, prefix.length); len >= 1; len--) {
          const subPrefix = prefix.substring(0, len);
          
          try {
            const record = await pb
              .collection("plates")
              .getFirstListItem(`prefix = "${subPrefix}"`);

            if (!record || !mounted) return;

            const districtData: DistrictInfo = {
              prefix: record.prefix ?? subPrefix,
              district: record.district ?? record.name ?? "Nieznany",
              voivodeship: record.voivodeship ?? record.region ?? "Nieznane",
              postalCode: record.postalCode ?? record.postal_code ?? null,
            };

            setDistrict(districtData);

            // Save to history
            await pb.collection("checked_plates").create({
              user: pb.authStore.record?.id,
              raw_text: result.plate,
              prefix: districtData.prefix,
              district: districtData.district,
              voivodeship: districtData.voivodeship,
              postal_code: districtData.postalCode,
            });

            break;
          } catch {
            // Try next prefix length
          }
        }
      } catch (error) {
        console.error("Błąd wyszukiwania powiatu:", error);
      }
    };

    lookupAndSave();

    return () => {
      mounted = false;
    };
  }, [result.plate, pb]);

  if (!result.plate) return null;

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
        <CardContent className="space-y-1">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-lg">{district.district}</p>
              <p className="text-sm text-gray-500">{district.voivodeship}</p>
              {district.postalCode && (
                <p className="text-xs text-gray-400">Kod: {district.postalCode}</p>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
