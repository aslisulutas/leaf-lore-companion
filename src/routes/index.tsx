import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, ImageUp, Loader2, Sprout } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { identifyPlant } from "@/lib/plant.functions";
import { resizeImage, saveItem } from "@/lib/plant-types";

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

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Lütfen bir görsel seçin.");
    setError(null);
    setBusy(true);
    try {
      const image = await resizeImage(file, 1024);
      setPreview(image);
      const result = await identifyPlant({ data: { image } });
      if (!result.isPlant) {
        setError("Bu fotoğrafta bir bitki bulamadık. Daha yakından tekrar deneyin.");
        return;
      }
      const thumb = await resizeImage(file, 480, 0.75);
      const id = String(Date.now());
      saveItem({ id, date: Date.now(), image: thumb, result });
      navigate({ to: "/sonuc/$id", params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="leaf-hero mt-2 rounded-3xl p-6 text-primary-foreground shadow-soft">
        <Sprout className="h-10 w-10" />
        <h1 className="font-display mt-4 text-4xl leading-tight">Bu bitki ne?</h1>
        <p className="mt-2 text-sm opacity-90">
          Fotoğrafını çek ya da yükle; türünü, sulama ve bakım ihtiyaçlarını anında öğren.
        </p>
      </section>

      {preview && (
        <div className="relative mt-6 overflow-hidden rounded-3xl">
          <img src={preview} alt="Seçilen bitki" className="aspect-square w-full object-cover" />
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/50 text-background">
              <Loader2 className="h-10 w-10 animate-spin" />
              <span className="text-sm font-medium">Bitki inceleniyor…</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 grid gap-3">
        <button disabled={busy} onClick={() => cam.current?.click()} className="flex items-center justify-center gap-3 rounded-2xl bg-primary py-5 text-lg font-semibold text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-60">
          <Camera className="h-6 w-6" /> Fotoğraf Çek
        </button>
        <button disabled={busy} onClick={() => gal.current?.click()} className="flex items-center justify-center gap-3 rounded-2xl border-2 border-primary/30 bg-card py-5 text-lg font-semibold text-primary transition active:scale-[0.98] disabled:opacity-60">
          <ImageUp className="h-6 w-6" /> Galeriden Yükle
        </button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
    </AppShell>
  );
}
