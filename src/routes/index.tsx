import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { addPlant } from "@/lib/plants-db";
import { Camera, ImageUp, Loader2, Sprout } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { identifyPlant } from "@/lib/plant.functions";
import { resizeImage } from "@/lib/plant-types";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yeşil Rehber – Bitki Tanıma" },
      { name: "description", content: "Fotoğrafını çek, bitkini tanı, bakım ve sulama bilgilerini öğren." },
      { property: "og:title", content: "Yeşil Rehber – Bitki Tanıma" },
      { property: "og:description", content: "Fotoğrafını çek, bitkini tanı, bakım ve sulama bilgilerini öğren." },
    ],
  }),
  component: Index,
});

function Index() {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const { lang, t } = useLang();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("pickImage"));
    setError(null);
    setBusy(true);
    try {
      const image = await resizeImage(file, 1024);
      setPreview(image);
      const result = await identifyPlant({ data: { image, lang } });
      if (!result.isPlant) {
        setError(t("noPlantFound"));
        return;
      }
      const thumb = await resizeImage(file, 480, 0.75);
      const id = await addPlant(thumb, result);
      navigate({ to: "/sonuc/$id", params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="leaf-hero mt-2 rounded-3xl p-6 text-primary-foreground shadow-soft">
        <Sprout className="h-10 w-10" />
        <h1 className="font-display mt-4 text-4xl leading-tight">{t("heroTitle")}</h1>
        <p className="mt-2 text-sm opacity-90">{t("heroText")}</p>
      </section>

      {signedIn === false && (
        <Link to="/auth" className="mt-6 flex items-center justify-center rounded-2xl bg-primary py-5 text-lg font-semibold text-primary-foreground shadow-soft">
          {t("signInToStart")}
        </Link>
      )}

      {signedIn && preview && (
        <div className="relative mt-6 overflow-hidden rounded-3xl">
          <img src={preview} alt={t("selectedPlant")} className="aspect-square w-full object-cover" />
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/50 text-background">
              <Loader2 className="h-10 w-10 animate-spin" />
              <span className="text-sm font-medium">{t("analyzing")}</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      {signedIn && <div className="mt-6 grid gap-3">
        <button disabled={busy} onClick={() => cam.current?.click()} className="flex items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-lg font-semibold text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-60">
          <Camera className="h-6 w-6" /> {t("takePhoto")}
        </button>
        <button disabled={busy} onClick={() => gal.current?.click()} className="flex items-center justify-center gap-3 rounded-2xl border-2 border-primary/30 bg-card py-5 text-lg font-semibold text-primary transition active:scale-[0.98] disabled:opacity-60">
          <ImageUp className="h-6 w-6" /> {t("uploadFromGallery")}
        </button>
      </div>}
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
    </AppShell>
  );
}
