import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Bug, CircleDot, Droplets, Flower, Flower2, Hourglass, Leaf, Scissors, Sparkles, Sprout, Sun, Thermometer, Wind, Mountain } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getPlant, removePlant, type PlantRow } from "@/lib/plants-db";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/sonuc/$id")({
  head: () => ({
    meta: [
      { title: "Bitki Sonucu – Yeşil Rehber" },
      { name: "description", content: "Tanımlanan bitkinin türü, bakım ve sulama bilgileri." },
      { property: "og:title", content: "Bitki Sonucu – Yeşil Rehber" },
      { property: "og:description", content: "Tanımlanan bitkinin türü, bakım ve sulama bilgileri." },
    ],
  }),
  component: Result,
});

function Result() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<PlantRow | null | undefined>(undefined);
  const navigate = useNavigate();
  const { t } = useLang();
  useEffect(() => {
    getPlant(id).then(setItem).catch(() => setItem(null));
  }, [id]);
  async function onDelete() {
    if (!confirm(t("deletePlantConfirm"))) return;
    await removePlant(id);
    navigate({ to: "/gecmis" });
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
      <img src={item.image} alt={r.commonName} className="aspect-square w-full rounded-3xl object-cover shadow-soft" />
      <div className="mt-5">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          %{Math.round(r.confidence)} {t("match")}
        </span>
        <h1 className="font-display mt-3 text-4xl text-foreground">{r.commonName}</h1>
        <p className="italic text-muted-foreground">{r.scientificName} · {r.family}</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{r.description}</p>
      </div>

      <h2 className="font-display mt-8 text-2xl text-foreground">{t("careGuide")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.title} className={`rounded-2xl bg-card p-4 shadow-soft ${c.title === wateringTitle ? "col-span-2 bg-secondary" : ""}`}>
            <c.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">{c.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        <Info icon={AlertTriangle} title={t("toxicity")} text={r.toxicity} warn />
        <Info icon={Bug} title={t("pests")} text={r.pests} />
        <Info icon={Sparkles} title={t("funFact")} text={r.funFact} />
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
