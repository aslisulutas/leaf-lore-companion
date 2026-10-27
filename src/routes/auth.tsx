import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Giriş Yap – Yeşil Rehber" },
      { name: "description", content: "Yeşil Rehber hesabına giriş yap veya ücretsiz kayıt ol." },
      { property: "og:title", content: "Giriş Yap – Yeşil Rehber" },
      { property: "og:description", content: "Yeşil Rehber hesabına giriş yap veya ücretsiz kayıt ol." },
    ],
  }),
  component: AuthPage,
});

function trError(msg: string) {
  if (/invalid login/i.test(msg)) return "E-posta veya şifre hatalı.";
  if (/not confirmed/i.test(msg)) return "E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzu kontrol edin.";
  if (/already registered/i.test(msg)) return "Bu e-posta ile zaten kayıt var. Giriş yapın.";
  if (/password/i.test(msg)) return "Şifre en az 6 karakter olmalı ve yeterince güçlü olmalı.";
  return msg;
}

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

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
      setError(trError(err instanceof Error ? err.message : "Bir hata oluştu."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-background px-6">
      <div className="mb-8 flex items-center gap-2">
        <Leaf className="h-7 w-7 text-primary" />
        <span className="font-display text-3xl text-foreground">Yeşil Rehber</span>
      </div>
      {sent ? (
        <div className="rounded-3xl bg-card p-6 text-center shadow-soft">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-display mt-4 text-2xl text-foreground">E-postanı kontrol et</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <b>{email}</b> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
          </p>
          <button onClick={() => { setSent(false); setMode("login"); }} className="mt-6 font-semibold text-primary">
            Giriş ekranına dön
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-3xl bg-card p-6 shadow-soft">
          <h1 className="font-display text-2xl text-foreground">{mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</h1>
          <label className="mt-5 block text-sm font-semibold text-foreground">E-posta</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring" />
          <label className="mt-4 block text-sm font-semibold text-foreground">Şifre</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring" />
          {error && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-60">
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }} className="font-semibold text-primary">
              {mode === "login" ? "Kayıt ol" : "Giriş yap"}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
