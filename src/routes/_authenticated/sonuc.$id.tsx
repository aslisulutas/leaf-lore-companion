import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completePlantCare } from "@/lib/plant-enrichment.functions";
import { missingCareFields } from "@/lib/plant-enrichment";
import { AlertTriangle, Bug, Check, CircleDot, Droplets, Flower, Flower2, Heart, Hourglass, Leaf, NotebookPen, Scissors, Share2, Sparkles, Sprout, Sun, Thermometer, Wind, Mountain } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getPlant, removePlant, setFavorite, setNote, type PlantRow } from "@/lib/plants-db";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/sonuc/$id")({
  head: () => ({
    meta: [
      { title: "Bitki Sonucu – Yeşil Rehber" },
      { name: "description", content: "Tanımlanan bitkinin türü, bakım ve sulama bilgileri." },
      { property: "og:title", content: "Bitki Sonucu – Yeşil Rehber" },
      { property: "og:description", content: "Tanımlanan bitkinin türü, bakım ve sulama bilgileri." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Result,
});

function Result() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<PlantRow | null | undefined>(undefined);
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const completeCare = useServerFn(completePlantCare);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  useEffect(() => {
    let active = true;
    setItem(undefined);
    setCompletionError(null);
    setCompleting(false);
    getPlant(id).then(async (plant) => {
      if (!active) return;
      setItem(plant);
      setNoteDraft(plant?.note ?? "");
      if (!plant || missingCareFields(plant.result).length === 0) return;
      setCompleting(true);
      try {
        const result = await completeCare({ data: { id, lang } });
        if (active) setItem({ ...plant, result });
      } catch (error) {
        if (active) setCompletionError(error instanceof Error ? error.message : "");
      } finally {
        if (active) setCompleting(false);
      }
    }).catch(() => { if (active) setItem(null); });
    return () => { active = false; };
    // Complete once when opening a record; changing the viewing language must not trigger another request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, completeCare]);
  async function retryCompletion() {
    if (!item || completing) return;
    setCompleting(true);
    setCompletionError(null);
    try {
      const result = await completeCare({ data: { id, lang } });
      setItem((current) => current?.id === id ? { ...current, result } : current);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : "");
    } finally {
      setCompleting(false);
    }
  }
  async function onDelete() {
    if (!confirm(t("deletePlantConfirm"))) return;
    await removePlant(id);
    navigate({ to: "/gecmis" });
  }
  async function toggleFavorite() {
    if (!item) return;
    const next = !item.favorite;
    setItem({ ...item, favorite: next });
    try {
      await setFavorite(id, next);
    } catch {
      setItem((current) => (current?.id === id ? { ...current, favorite: !next } : current));
    }
  }
  async function onShare() {
    const url = window.location.href;
    const title = item?.result.commonName ?? t("appName");
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  }
  async function saveNote() {
    if (!item || savingNote) return;
    setSavingNote(true);
    try {
      await setNote(id, noteDraft);
      setItem((current) => (current?.id === id ? { ...current, note: noteDraft.trim() || null } : current));
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } finally {
      setSavingNote(false);
    }
  }

  if (item === undefined) return <AppShell>{null}</AppShell>;
  if (!item)
    return (
      <AppShell>
        <p className="mt-10 text-center text-muted-foreground">{t("notFound")}</p>
      </AppShell>
    );
  const r = item.result;
  const wateringTitle = t("watering");
  const cards = [
    { icon: Droplets, title: wateringTitle, text: r.watering },
    { icon: Sun, title: t("light"), text: r.light },
    { icon: Thermometer, title: t("temperature"), text: r.temperature },
    { icon: Wind, title: t("humidity"), text: r.humidity },
    { icon: Mountain, title: t("soil"), text: r.soil },
    { icon: Sprout, title: t("fertilizing"), text: r.fertilizing },
    { icon: Scissors, title: t("pruning"), text: r.pruning },
    { icon: Flower2, title: t("propagation"), text: r.propagation },
    { icon: Hourglass, title: t("growthTime"), text: r.growthTime },
    { icon: CircleDot, title: t("bulb"), text: r.bulb },
    { icon: Flower, title: t("blooming"), text: r.blooming },
    { icon: Sparkles, title: t("pollen"), text: r.pollen },
  ].filter((c) => !!c.text);

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-3xl shadow-soft">
        <img src={item.image} alt={r.commonName} className="aspect-[4/5] w-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex justify-between p-3">
          <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
            %{Math.round(r.confidence)} {t("match")}
          </span>
          <div className="flex gap-2">
            <button
              onClick={toggleFavorite}
              aria-label={item.favorite ? t("unfavorite") : t("favorite")}
              aria-pressed={item.favorite}
              className="rounded-full bg-card/90 p-2.5 backdrop-blur"
            >
              <Heart className={`h-5 w-5 ${item.favorite ? "fill-destructive text-destructive" : "text-foreground"}`} />
            </button>
            <button onClick={onShare} aria-label={t("share")} className="rounded-full bg-card/90 p-2.5 backdrop-blur">
              {copied ? <Check className="h-5 w-5 text-primary" /> : <Share2 className="h-5 w-5 text-foreground" />}
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-5 pt-16">
          <h1 className="font-display text-4xl text-primary-foreground drop-shadow">{r.commonName}</h1>
          <p className="italic text-primary-foreground/90 drop-shadow">{r.scientificName} · {r.family}</p>
        </div>
      </div>
      {copied && <p role="status" className="mt-2 text-center text-xs text-primary">{t("linkCopied")}</p>}
      <p className="mt-4 text-sm leading-relaxed text-foreground/80">{r.description}</p>

      <h2 className="font-display mt-8 text-2xl text-foreground">{t("careGuide")}</h2>
      {completing && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("completingCare")}</p>}
      {completionError !== null && <div role="alert" className="mt-3 text-sm text-destructive">
        <p>{t("careCompletionFailed")}</p>
        {completionError && <p className="mt-1">{completionError}</p>}
        <Button variant="outline" onClick={retryCompletion} disabled={completing} className="mt-2"><RefreshCw />{t("retryCare")}</Button>
      </div>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {cards.map((c) => {
          const isWatering = c.title === wateringTitle;
          return (
            <div key={c.title} className={`rounded-2xl bg-card p-4 shadow-soft ${isWatering ? "col-span-2 bg-secondary" : ""}`}>
              <span className={`inline-flex rounded-xl p-2 ${isWatering ? "bg-card" : "bg-secondary"}`}>
                <c.icon className="h-5 w-5 text-primary" />
              </span>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.text}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3">
        <Info icon={AlertTriangle} title={t("toxicity")} text={r.toxicity} warn />
        <Info icon={Bug} title={t("pests")} text={r.pests} />
        <Info icon={Sparkles} title={t("funFact")} text={r.funFact} />
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <NotebookPen className="h-5 w-5 text-primary" /> {t("myNote")}
        </h3>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder={t("notePlaceholder")}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 flex items-center gap-3">
          <Button onClick={saveNote} disabled={savingNote} size="sm">
            {savingNote && <Loader2 className="animate-spin" />} {t("saveNote")}
          </Button>
          {noteSaved && <span role="status" className="flex items-center gap-1 text-xs text-primary"><Check className="h-4 w-4" />{t("noteSaved")}</span>}
        </div>
      </div>

      <Link to="/" className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground">
        <Leaf className="h-5 w-5" /> {t("scanNewPlant")}
      </Link>
      <button onClick={onDelete} className="mt-3 w-full rounded-2xl border-2 border-destructive/30 py-4 font-semibold text-destructive">
        {t("deletePlant")}
      </button>
    </AppShell>
  );
}

function Info({ icon: Icon, title, text, warn }: { icon: typeof Bug; title: string; text: string; warn?: boolean }) {
  return (
    <div className={`flex gap-3 rounded-2xl p-4 ${warn ? "bg-destructive/10" : "bg-card shadow-soft"}`}>
      <Icon className={`h-5 w-5 shrink-0 ${warn ? "text-destructive" : "text-primary"}`} />
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
