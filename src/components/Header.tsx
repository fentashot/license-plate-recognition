import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Car, Sun, Moon, LogOut, User, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { pathname: url } = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut, pb } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="border-b">
      <div className="grid grid-cols-3 p-4 px-6 w-full mx-auto ">
        <div className="flex items-center gap-3 justify-self-start">
          <Car className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold hidden xl:block">
            Rozpoznawanie Tablic Rejestracyjnych
          </h1>
        </div>
        <nav className="flex gap-2 justify-self-center">
          {url !== "/" && (
            <>
              <Button variant={url === "/local" ? "default" : "ghost"} asChild>
                <Link to="/local">Local</Link>
              </Button>
              <Button
                variant={url === "/external" ? "default" : "ghost"}
                asChild
              >
                <Link to="/external">External</Link>
              </Button>
              {/* <Button
                variant={url === "/history" ? "default" : "ghost"}
                asChild
              >
                <Link to="/history">Historia</Link>
              </Button> */}
            </>
          )}
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
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 relative h-9 w-9 rounded-full p-0"
                >
                  {user.avatar ? (
                    <img
                      src={`${pb?.baseUrl}/api/files/users/${user.id}/${user.avatar}`}
                      alt={user.name || "Avatar"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Moje konto</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="w-4 h-4 mr-1" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <Settings className="w-4 h-4 mr-1" />
                    Ustawienia
                  </Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild>
                  <Link to="/history">
                    <History className="w-4 h-4 mr-1" />
                    Historia
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-700 font-semibold"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
