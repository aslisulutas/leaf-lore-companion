import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, CheckCircle2, ImageUp, Loader2, NotebookPen, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { diagnosePlant, type HealthResult } from "@/lib/plant-health.functions";
import { addLog, listPlants, type PlantRow } from "@/lib/plants-db";
import { resizeImage } from "@/lib/plant-types";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/saglik")({
  validateSearch: (search: Record<string, unknown>): { plant?: string } => ({
    plant: typeof search.plant === "string" && search.plant ? search.plant : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Bitki Sağlığı – Yeşil Rehber" },
      { name: "description", content: "Yaprak fotoğrafından olası hastalık ve zararlıları gör." },
      { property: "og:title", content: "Bitki Sağlığı – Yeşil Rehber" },
      { property: "og:description", content: "Yaprak fotoğrafından olası hastalık ve zararlıları gör." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HealthPage,
});

const SEV_STYLE: Record<HealthResult["severity"], string> = {
  healthy: "bg-primary/10 text-primary",
  minor: "bg-primary/10 text-primary",
  moderate: "bg-accent text-accent-foreground",
  severe: "bg-destructive/10 text-destructive",
  unknown: "bg-muted text-muted-foreground",
};

function HealthPage() {
  const { plant: preselect } = Route.useSearch();
  const { lang, t } = useLang();
  const diagnose = useServerFn(diagnosePlant);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [target, setTarget] = useState(preselect ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listPlants().then(setPlants).catch(() => setPlants([]));
  }, []);

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("pickImage"));
    setError(null);
    setResult(null);
    setSaved(false);
    setBusy(true);
    try {
      const image = await resizeImage(file, 1024);
      setPhoto(image);
      const name = plants.find((p) => p.id === target)?.result.commonName ?? "";
      const out = await diagnose({ data: { image, plantName: name, lang } });
      if (!out.isPlant) {
        setError(t("healthNoPlant"));
        return;
      }
      setResult(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setBusy(false);
    }
  }

  async function saveToJournal() {
    if (!result || !target || !photo) return;
    const note = [
      sevKey ? `${t("healthTitle")}: ${t(sevKey)}` : t("healthTitle"),
      result.summary,
      ...result.conditions.map((c) => `${c.name} (${c.likelihood})`),
    ]
      .filter(Boolean)
      .join("\n");
    await addLog(target, "health", { image: await resizeImage(dataUrlToFile(photo), 640, 0.7), note });
    setSaved(true);
  }

  const sevKey = result ? (`sev${result.severity[0].toUpperCase()}${result.severity.slice(1)}` as "sevHealthy") : null;

  return (
    <AppShell>
      <h1 className="font-display flex items-center gap-2 text-3xl text-foreground">
        <Stethoscope className="h-7 w-7 text-primary" /> {t("healthTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("healthText")}</p>

      {plants.length > 0 && (
        <label className="mt-4 block text-sm text-muted-foreground">
          {t("journal")}
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground"
          >
            <option value="">—</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.result.commonName}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-4 grid gap-3">
        <button disabled={busy} onClick={() => cam.current?.click()} className="flex items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-lg font-semibold text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-60">
          <Camera className="h-6 w-6" /> {t("takePhoto")}
        </button>
        <button disabled={busy} onClick={() => gal.current?.click()} className="flex items-center justify-center gap-3 rounded-2xl border-2 border-primary/30 bg-card py-4 text-lg font-semibold text-primary transition active:scale-[0.98] disabled:opacity-60">
          <ImageUp className="h-6 w-6" /> {t("uploadFromGallery")}
        </button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      {photo && (
        <div className="relative mt-4 overflow-hidden rounded-2xl">
          <img src={photo} alt={t("healthTitle")} className="aspect-square w-full object-cover" />
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/50 text-background">
              <Loader2 className="h-10 w-10 animate-spin" />
              <span className="text-sm font-medium">{t("analyzingHealth")}</span>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      {result && !busy && (
        <div className="mt-5 grid gap-3">
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${SEV_STYLE[result.severity]}`}>
            {sevKey ? t(sevKey) : result.severity}
          </span>
          <section className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-foreground">{t("healthSummary")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
          </section>

          {result.conditions.length > 0 && (
            <section>
              <h2 className="font-display text-xl text-foreground">{t("healthConditions")}</h2>
              <div className="mt-2 grid gap-3">
                {result.conditions.map((c) => (
                  <div key={c.name} className="rounded-2xl bg-card p-4 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                        {t("healthLikelihood")}: {c.likelihood}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><b className="text-foreground/80">{t("healthSymptoms")}:</b> {c.symptoms}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground"><b className="text-foreground/80">{t("healthTreatment")}:</b> {c.treatment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.immediateActions.length > 0 && (
            <section className="rounded-2xl bg-secondary p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><CheckCircle2 className="h-5 w-5 text-primary" />{t("healthActions")}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
                {result.immediateActions.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </section>
          )}

          {result.prevention && (
            <section className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><AlertTriangle className="h-5 w-5 text-primary" />{t("healthPrevention")}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.prevention}</p>
            </section>
          )}

          {plants.length > 0 && (
            <div className="flex items-center gap-3">
              <Button onClick={saveToJournal} disabled={!target || saved || busy}>
                <NotebookPen /> {t("saveToJournal")}
              </Button>
              {saved && <span role="status" className="text-xs text-primary">{t("healthSaved")}</span>}
              </Button>
            </div>
          )}
          <Link to="/" className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground">
            <Camera className="h-5 w-5" /> {t("scanNewPlant")}
          </Link>
        </div>
      )}
    </AppShell>
  );
}

function dataUrlToFile(dataUrl: string): File {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], "leaf.jpg", { type: mime });
}
