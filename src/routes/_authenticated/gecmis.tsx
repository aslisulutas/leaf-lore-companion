import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listPlants, removePlant, type PlantRow } from "@/lib/plants-db";

export const Route = createFileRoute("/_authenticated/gecmis")({
  head: () => ({
    meta: [
      { title: "Geçmiş Taramalar – Yeşil Rehber" },
      { name: "description", content: "Daha önce tanımladığın bitkiler." },
      { property: "og:title", content: "Geçmiş Taramalar – Yeşil Rehber" },
      { property: "og:description", content: "Daha önce tanımladığın bitkiler." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<PlantRow[] | null>(null);
  const load = () => listPlants().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-foreground">Bitkilerim</h1>
      {items === null ? null : items.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">Henüz tarama yok. İlk bitkini tara!</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
              <Link to="/sonuc/$id" params={{ id: h.id }} className="flex flex-1 items-center gap-3">
                <img src={h.image} alt={h.result.commonName} className="h-16 w-16 rounded-xl object-cover" />
                <div>
                  <p className="font-semibold text-foreground">{h.result.commonName}</p>
                  <p className="text-xs italic text-muted-foreground">{h.result.scientificName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString("tr-TR")}</p>
                </div>
              </Link>
              <button aria-label="Sil" onClick={async () => { if (!confirm("Silinsin mi?")) return; await removePlant(h.id); load(); }} className="p-2 text-muted-foreground">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
