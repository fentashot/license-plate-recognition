import { Link, useLocation } from "@tanstack/react-router";
import { Car, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ui/theme-provider";

export default function Header() {
  const loc = useLocation?.();
  const url =
    (loc as any)?.pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const { theme, setTheme } = useTheme();
  return (
    <header className="border-b">
      <div className="grid grid-cols-3 p-4 w-full mx-auto ">
        <div className="flex items-center gap-3 justify-self-start">
          <Car className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold hidden xl:block">
            Rozpoznawanie Tablic Rejestracyjnych
          </h1>
        </div>
        <nav className="flex gap-2 justify-self-center">
          <Button variant={url === "/" ? "default" : "ghost"} asChild>
            <Link to="/">Local</Link>
          </Button>
          <Button variant={url === "/external" ? "default" : "ghost"} asChild>
            <Link to="/external">External</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2 justify-self-end">
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            id="theme-toggle"
          />
          {theme === "dark" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </div>
      </div>
    </header>
  );
}
