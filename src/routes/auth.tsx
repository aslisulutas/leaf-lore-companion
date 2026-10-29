import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Giriş Yap – Yeşil Rehber" },
      { name: "description", content: "Yeşil Rehber hesabına giriş yap veya ücretsiz kayıt ol." },
      { property: "og:title", content: "Giriş Yap – Yeşil Rehber" },
      { property: "og:description", content: "Yeşil Rehber hesabına giriş yap veya ücretsiz kayıt ol." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function errorKey(msg: string): TKey | null {
  if (/invalid login/i.test(msg)) return "errInvalidLogin";
  if (/not confirmed/i.test(msg)) return "errNotConfirmed";
  if (/already registered/i.test(msg)) return "errAlreadyRegistered";
  if (/not allowed|invalid.*email/i.test(msg)) return "errInvalidEmail";
  if (/password/i.test(msg)) return "errPassword";
  return null;
}

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { lang, setLang, t } = useLang();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) throw new Error("already registered");
        if (data.session) navigate({ to: "/" });
        else setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const key = errorKey(raw);
      setError(key ? t(key) : raw || t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-background px-6">
      <div className="mb-8 flex items-center gap-2">
        <Leaf className="h-7 w-7 text-primary" />
        <span className="font-display flex-1 text-3xl text-foreground">{t("appName")}</span>
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
      </div>
      {sent ? (
        <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-display mt-4 text-2xl text-foreground">{t("checkEmail")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <b>{email}</b> {t("verificationSent")}
          </p>
          <button onClick={() => { setSent(false); setMode("login"); }} className="mt-6 font-semibold text-primary">
            {t("backToLogin")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-3xl bg-card p-6 shadow-soft">
          <h1 className="font-display text-2xl text-foreground">{mode === "login" ? t("login") : t("signup")}</h1>
          <label className="mt-5 block text-sm font-semibold text-foreground">{t("email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring" />
          <label className="mt-4 block text-sm font-semibold text-foreground">{t("password")}</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring" />
          {error && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-60">
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {mode === "login" ? t("login") : t("signup")}
          </button>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }} className="font-semibold text-primary">
              {mode === "login" ? t("signup") : t("login")}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
