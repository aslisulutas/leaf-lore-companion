import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, Droplets, Heart, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { listPlants, markCare, removePlant, type PlantRow } from "@/lib/plants-db";
import { dueInfo, plantsDueNow, type DueInfo } from "@/lib/plant-schedule";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/gecmis")({
  head: () => ({
    meta: [
      { title: "Geçmiş Taramalar – Yeşil Rehber" },
      { name: "description", content: "Daha önce tanımladığın bitkiler." },
      { property: "og:title", content: "Geçmiş Taramalar – Yeşil Rehber" },
      { property: "og:description", content: "Daha önce tanımladığın bitkiler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function useDueLabel() {
  const { t } = useLang();
  return (due: DueInfo) =>
    due.state === "none" ? null
      : due.state === "due" ? t("dueToday")
        : due.state === "overdue" ? `${due.days} ${t("daysOverdue")}`
          : `${due.days} ${t("daysLeft")}`;
}

function HistoryPage() {
  const [items, setItems] = useState<PlantRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { lang, t } = useLang();
  const label = useDueLabel();
  const load = () => listPlants().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const due = items ? plantsDueNow(items) : [];

  async function waterNow(plant: PlantRow) {
    setBusyId(plant.id);
    try {
      await markCare(plant.id, "water");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-foreground">{t("myPlants")}</h1>

      {items && due.length > 0 && (
        <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><CalendarClock className="h-5 w-5 text-primary" />{t("todayCare")}</h2>
          <div className="mt-3 grid gap-2">
            {due.map((plant) => {
              const water = dueInfo(plant, "water");
              const fert = dueInfo(plant, "fertilize");
              return (
                <div key={plant.id} className="flex items-center gap-3 rounded-xl bg-secondary px-3 py-2">
                  <img src={plant.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{plant.result.commonName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {water.state !== "none" && `${t("watering")}: ${label(water)}`}
                      {water.state !== "none" && fert.state !== "none" && " · "}
                      {fert.state !== "none" && `${t("fertilizing")}: ${label(fert)}`}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => waterNow(plant)} disabled={busyId === plant.id}>
                    {busyId === plant.id ? <Droplets className="animate-pulse" /> : <Droplets />} {t("markWatered")}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {items === null ? null : items.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">{t("noScansYet")}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((h) => {
            const water = dueInfo(h, "water");
            const chip = label(water);
            return (
              <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                <Link to="/sonuc/$id" params={{ id: h.id }} className="flex flex-1 items-center gap-3">
                  <img src={h.image} alt={h.result.commonName} className="h-16 w-16 rounded-xl object-cover" />
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-foreground">
                      {h.result.commonName}
                      {h.favorite && <Heart className="h-3.5 w-3.5 fill-destructive text-destructive" />}
                    </p>
                    <p className="text-xs italic text-muted-foreground">{h.result.scientificName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString(lang === "en" ? "en-US" : "tr-TR")}</p>
                    {chip && (
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${water.state === "overdue" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                        {t("watering")}: {chip}
                      </span>
                    )}
                  </div>
                </Link>
                <button aria-label={t("delete")} onClick={async () => { if (!confirm(t("deleteConfirm"))) return; await removePlant(h.id); load(); }} className="p-2 text-muted-foreground">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
