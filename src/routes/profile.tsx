import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, FileText, Calendar } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

const profileSchema = z.object({
  name: z.string().min(1, "Imię jest wymagane"),
  email: z.email("Nieprawidłowy adres email"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfilePage() {
  const { user, signOut, pb } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setError(null);
    setSuccess(null);
    try {
      await pb.collection("users").update(user?.id || "", {
        name: data.name,
      });
      setSuccess("Profil zaktualizowany pomyślnie!");
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Błąd aktualizacji profilu"
      );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profil użytkownika</h1>
        <p className="text-muted-foreground">
          Zarządzaj swoim kontem i ustawieniami
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informacje profilu
            </CardTitle>
            <CardDescription>
              Twoje podstawowe dane konta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isEditing ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Imię
                    </label>
                    <p className="text-lg mt-1">{user.name || "Nie ustawione"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-lg mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      ID Użytkownika
                    </label>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      {user.id}
                    </p>
                  </div>
                  {user.verified && (
                    <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        ✓ Email zweryfikowany
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Edytuj profil
                </Button>
              </>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imię</FormLabel>
                        <FormControl>
                          <Input placeholder="Jan Kowalski" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (tylko do odczytu)</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? "Zapisywanie..."
                        : "Zapisz zmiany"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                    >
                      Anuluj
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Ustawienia konta
            </CardTitle>
            <CardDescription>
              Zarządzaj bezpieczeństwem konta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-900 dark:text-amber-400">
                ⚠️ Zmiana hasła i dodatkowe ustawienia bezpieczeństwa będą dostępne
                w przyszłych wersjach.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Strefa niebezpieczeństwa
            </CardTitle>
            <CardDescription>
              Akcje, które nie mogą być cofnięte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                signOut();
              }}
            >
              Usuń konto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
