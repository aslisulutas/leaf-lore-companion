import { Link } from "@tanstack/react-router";
import { Camera, History, Leaf } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="flex items-center gap-2 px-5 pt-6 pb-3">
        <Leaf className="h-6 w-6 text-primary" />
        <span className="font-display text-2xl text-foreground">Yeşil Rehber</span>
      </header>
      <main className="flex-1 px-5 pb-28">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-border bg-card/95 py-3 backdrop-blur">
        <Link to="/" className="flex flex-col items-center gap-1 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
          <Camera className="h-6 w-6" /> Tara
        </Link>
        <Link to="/gecmis" className="flex flex-col items-center gap-1 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
          <History className="h-6 w-6" /> Geçmiş
        </Link>
      </nav>
    </div>
  );
}
