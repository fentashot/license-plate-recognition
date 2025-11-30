import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: () => (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  ),
});

interface PlateRecord {
  id: string;
  raw_text: string;
  prefix: string;
  district: string;
  voivodeship: string;
  postal_code?: string;
  created: string;
}

function HistoryPage() {
  const { user, pb } = useAuth();
  const [plates, setPlates] = useState<PlateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Pobierz wszystkie rekordy historii dla użytkownika
        const records = await pb
          .collection("checked_plates")
          .getFullList({ $autoCancel: false });

        if (!isMounted) return;

        // Type cast na PlateRecord
        const typedRecords = records as unknown as PlateRecord[];

        // Sortuj od najnowszych
        typedRecords.sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime()
        );

        setPlates(typedRecords);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Błąd wczytywania historii"
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [user, pb]);

  const handleDelete = async (id: string) => {
    try {
      await pb.collection("checked_plates").delete(id);
      setPlates(plates.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania rekordu");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Na pewno chcesz usunąć całą historię?")) return;

    try {
      for (const plate of plates) {
        await pb.collection("checked_plates").delete(plate.id);
      }
      setPlates([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania historii");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Historia tablic</h1>
        <p className="text-muted-foreground mb-6">Wczytywanie...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Historia sprawdzonych tablic
        </h1>
        <p className="text-muted-foreground">
          Wszystkie niepowtarzające się tablice które sprawdzileś
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
          {error}
        </div>
      )}

      {plates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Historia jest pusta. Zacznij od rozpoznawania tablic!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {plates.length} unikalnych tablic
            </p>
            {plates.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearAll}>
                Wyczyść historię
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plates.map((record) => (
              <Card key={record.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-mono">
                        {record.raw_text}
                      </CardTitle>
                      <CardDescription>
                        {new Date(record.created).toLocaleString("pl-PL")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Prefiks:</span>
                    <span className="font-semibold">{record.prefix}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Powiat:
                    </span>
                    <span className="font-semibold">{record.district}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Województwo:</span>
                    <span className="font-semibold">{record.voivodeship}</span>
                  </div>
                  {record.postal_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Kod pocztowy:
                      </span>
                      <span className="font-semibold">
                        {record.postal_code}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
