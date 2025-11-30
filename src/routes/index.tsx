import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to custom page
  useEffect(() => {
    if (user && !loading) {
      navigate({ to: "/local" });
    }
  }, [user, loading, navigate]);

  const handleLoginSuccess = () => {
    navigate({ to: "/local" });
  };

  const handleRegisterSuccess = () => {
    navigate({ to: "/local" });
  };

  return (
    <div className="flex mt-[10vh] items-center justify-center ">
      <Card className="w-full max-w-md p-8 pb-12 rounded-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Rozpoznawanie Tablic
          </CardTitle>
          <CardDescription className="text-center">
            Zaloguj się lub utwórz konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Logowanie</TabsTrigger>
              <TabsTrigger value="register">Rejestracja</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <LoginForm onSuccess={handleLoginSuccess} />
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
