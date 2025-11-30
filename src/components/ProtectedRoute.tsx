import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  isVerifiedOnly?: boolean;
}

export function ProtectedRoute({
  children,
  isVerifiedOnly,
}: ProtectedRouteProps) {
  const { user, loading, pb } = useAuth();

  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setError(null);
    try {
      await pb.collection("users").authRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Wystąpił błąd");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (isVerifiedOnly && !user.verified) {
    return (
      <Card className=" max-w-xl py- px-8 mx-auto mt-[5vh] text-center">
        <p className="font-semibold">
          Musisz być zweryfikowany aby używać zewnętrznego API. Poczekaj aż
          admin zatwierdzi Twoją rejestrację.
        </p>
        <Button onClick={() => handleRefresh()}>Odśwież</Button>
        {error && (
          <p className="mt-4 text-sm text-red-600">
            Błąd podczas odświeżania: {error}
          </p>
        )}
      </Card>
    );
  }

  return <>{children}</>;
}
