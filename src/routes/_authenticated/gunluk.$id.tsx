import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Droplets, Flower2, ImageUp, Loader2, NotebookPen, Sparkles, Stethoscope, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { addLog, getPlant, listLogs, removeLog, type PlantLog, type PlantRow } from "@/lib/plants-db";
import { resizeImage } from "@/lib/plant-types";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/gunluk/$id")({
  head: () => ({
    meta: [
      { title: "Bitki Günlüğü – Yeşil Rehber" },
      { name: "description", content: "Bitkinin fotoğraflarını ve notlarını zaman içinde sakla." },
      { property: "og:title", content: "Bitki Günlüğü – Yeşil Rehber" },
      { property: "og:description", content: "Bitkinin fotoğraflarını ve notlarını zaman içinde sakla." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

const KIND_ICON = { photo: Camera, note: NotebookPen, water: Droplets, fertilize: Flower2, health: Stethoscope } as const;

function JournalPage() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const [plant, setPlant] = useState<PlantRow | null | undefined>(undefined);
  const [logs, setLogs] = useState<PlantLog[] | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);

  const load = () => listLogs(id).then(setLogs).catch(() => setLogs([]));
  useEffect(() => {
    let active = true;
    getPlant(id).then((p) => { if (active) setPlant(p); }).catch(() => { if (active) setPlant(null); });
    load();
    return () => { active = false; };
  }, [id]);

  async function addPhoto(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const image = await resizeImage(file, 720, 0.78);
      const entry = await addLog(id, "photo", { image, note: noteDraft });
      setLogs((current) => (current ? [entry, ...current] : [entry]));
      setNoteDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    const text = noteDraft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const entry = await addLog(id, "note", { note: text });
      setLogs((current) => (current ? [entry, ...current] : [entry]));
      setNoteDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(entryId: string) {
    if (!confirm(t("deleteEntryConfirm"))) return;
    await removeLog(entryId);
    setLogs((current) => (current ? current.filter((l) => l.id !== entryId) : current));
  }

  if (plant === undefined) return <AppShell>{null}</AppShell>;
  if (!plant)
    return (
      <AppShell>
        <p className="mt-10 text-center text-muted-foreground">{t("notFound")}</p>
      </AppShell>
    );

  const photos = (logs ?? []).filter((l) => l.image).reverse();
  const first = photos[0];
  const latest = photos[photos.length - 1];

  return (
    <AppShell>
      <div className="flex items-center gap-3">
        <img src={plant.image} alt={plant.result.commonName} className="h-14 w-14 rounded-2xl object-cover" />
        <div className="min-w-0">
          <h1 className="font-display truncate text-2xl text-foreground">{t("journalTitle")}</h1>
          <p className="truncate text-xs italic text-muted-foreground">{plant.result.commonName} · {plant.result.scientificName}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("journalText")}</p>

      {first && latest && first.id !== latest.id && (
        <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-foreground">{t("growthCompare")}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[{ label: t("firstPhoto"), entry: first }, { label: t("latestPhoto"), entry: latest }].map(({ label, entry }) => (
              <figure key={label}>
                <img src={entry.image!} alt={label} className="aspect-[3/4] w-full rounded-xl object-cover" />
                <figcaption className="mt-1 text-xs text-muted-foreground">{label} · {new Date(entry.created_at).toLocaleDateString(lang === "en" ? "en-US" : "tr-TR")}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder={t("journalNotePlaceholder")}
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => cam.current?.click()} disabled={busy}><Camera />{t("addJournalPhoto")}</Button>
          <Button size="sm" variant="outline" onClick={() => gal.current?.click()} disabled={busy}><ImageUp />{t("uploadFromGallery")}</Button>
          <Button size="sm" variant="outline" onClick={addNote} disabled={busy || !noteDraft.trim()}><NotebookPen />{t("addJournalNote")}</Button>
        </div>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />

      {logs === null ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("analyzing")}</p>
      ) : logs.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">{t("noJournalEntries")}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {logs.map((l) => {
            const Icon = KIND_ICON[l.kind] ?? Sparkles;
            return (
              <div key={l.id} className="rounded-2xl bg-card p-3 shadow-soft">
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-xl bg-secondary p-2"><Icon className="h-4 w-4 text-primary" /></span>
                  <span className="flex-1 text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString(lang === "en" ? "en-US" : "tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <button aria-label={t("delete")} onClick={() => onDelete(l.id)} className="p-1.5 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                </div>
                {l.image && <img src={l.image} alt="" className="mt-2 aspect-[4/3] w-full rounded-xl object-cover" />}
                {l.note && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{l.note}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Link to="/sonuc/$id" params={{ id }} className="mt-6 flex items-center justify-center rounded-2xl bg-primary py-4 font-semibold text-primary-foreground">
        {t("backToPlant")}
      </Link>
    </AppShell>
  );
}
