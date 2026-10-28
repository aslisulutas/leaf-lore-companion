import { Link, useNavigate } from "@tanstack/react-router";
import { Camera, History, Leaf, LogOut } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="flex items-center gap-2 px-5 pt-6 pb-3">
        <Leaf className="h-6 w-6 text-primary" />
        <span className="font-display flex-1 text-2xl text-foreground">{t("appName")}</span>
        <div className="flex items-center rounded-full border border-border text-xs font-semibold">
          <button
            onClick={() => setLang("tr")}
            aria-pressed={lang === "tr"}
            className={`rounded-full px-2.5 py-1 ${lang === "tr" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            TR
          </button>
          <button
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            className={`rounded-full px-2.5 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            EN
          </button>
        </div>
        {email && (
          <button onClick={signOut} aria-label={t("signOut")} className="flex items-center gap-1 text-xs text-muted-foreground">
            <LogOut className="h-5 w-5" /> {t("signOut")}
          </button>
        )}
      </header>
      <main className="flex-1 px-5 pb-28">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-border bg-card/95 py-3 backdrop-blur">
        <Link to="/" className="flex flex-col items-center gap-1 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>
          <Camera className="h-6 w-6" /> {t("scan")}
        </Link>
        <Link to="/gecmis" className="flex flex-col items-center gap-1 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
          <History className="h-6 w-6" /> {t("history")}
        </Link>
      </nav>
    </div>
  );
}
