import { createRootRoute, Outlet } from "@tanstack/react-router";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/context/AuthContext";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Header />
        <main>
          <Outlet />
        </main>
      </ThemeProvider>
    </AuthProvider>
  );
}
