import { Link, useLocation } from "@tanstack/react-router";
import { Car } from "lucide-react";

export default function Header() {
  const loc = useLocation?.();
  const url = (loc as any)?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex">
      <div className="container mx-auto px-4 flex items-center gap-3">
        <Car className="w-8 h-8 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">
          Rozpoznawanie Tablic Rejestracyjnych
        </h1>
      </div>
      <nav className="gap-4 flex min-w-32">
        <div className={url === "/" ? "font-bold" : ""}>
          <Link to="/">Home</Link>
        </div>
        <div className={url === "/custom" ? "font-bold" : ""}>
          <Link to="/custom">Custom</Link>
        </div>
      </nav>
    </header>
  );
}
