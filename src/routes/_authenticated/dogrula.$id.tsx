import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, BookOpenCheck, ExternalLink, Leaf, Loader2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getPlant } from "@/lib/plants-db";
import { plantSources } from "@/lib/plant-sources";
import { useLang } from "@/lib/i18n";

const verificationQuery = (id: string) => queryOptions({
  queryKey: ["plant-verification", id],
  queryFn: () => getPlant(id),
  staleTime: 0,
});

export const Route = createFileRoute("/_authenticated/dogrula/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(verificationQuery(params.id)),
  head: () => ({
    meta: [
      { title: "Kaynaklarla Bitki Doğrulama – Yeşil Rehber" },
      { name: "description", content: "Bitkinizin bilimsel adını, bakım ve zehirlilik bilgilerini bağımsız botanik kaynaklarında karşılaştırın." },
      { property: "og:title", content: "Kaynaklarla Bitki Doğrulama – Yeşil Rehber" },
      { property: "og:description", content: "Kew, RHS ve ASPCA kaynaklarıyla bitki bilgilerinizi karşılaştırın." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: VerificationPending,
  errorComponent: VerificationError,
  component: VerificationPage,
});

function VerificationPending() {
  return <AppShell><Loader2 aria-label="Loading" className="mx-auto mt-12 h-6 w-6 animate-spin text-primary" /></AppShell>;
}

function VerificationError() {
  const { t } = useLang();
  const router = useRouter();
  return <AppShell><div role="alert" className="mt-8 text-center">
    <p className="text-destructive">{t("plantLoadFailed")}</p>
    <Button variant="outline" className="mt-4" onClick={() => router.invalidate()}><RefreshCw />{t("retryLoad")}</Button>
  </div></AppShell>;
}

function VerificationPage() {
  const { id } = Route.useParams();
  const { data: plant } = useSuspenseQuery(verificationQuery(id));
  const { t } = useLang();
  if (!plant) return <AppShell><p className="mt-10 text-center text-muted-foreground">{t("notFound")}</p>
    <Button asChild variant="outline" className="mt-4 w-full"><Link to="/gecmis"><ArrowLeft />{t("history")}</Link></Button>
  </AppShell>;

  const r = plant.result;
  const facts = [
    { label: t("scientificName"), value: r.scientificName },
    { label: t("soil"), value: r.soil },
    { label: t("watering"), value: r.watering },
    { label: t("blooming"), value: r.blooming },
    { label: t("toxicity"), value: r.toxicity },
  ].filter(({ value }) => value?.trim());

  return <AppShell>
    <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3"><Link to="/sonuc/$id" params={{ id }}><ArrowLeft />{t("backToPlant")}</Link></Button>
    <h1 className="font-display text-3xl leading-tight text-foreground">{t("verificationTitle")}</h1>
    <div className="mt-5 flex items-center gap-4">
      <img src={plant.image} alt={r.commonName} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0">
        <h2 className="font-display break-words text-2xl text-foreground">{r.commonName}</h2>
        <p className="break-words text-sm italic text-muted-foreground">{r.scientificName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{r.family}</p>
      </div>
    </div>
    <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t("identificationEstimate")}</p>

    <section className="mt-7">
      <h2 className="font-display text-xl">{t("sourceDirectory")}</h2>
      {!r.scientificName?.trim() && <p className="mt-2 text-sm text-muted-foreground">{t("noScientificName")}</p>}
      <div className="mt-3 grid gap-3">
        {plantSources(r.scientificName || "").map((source) => <article key={source.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3"><Leaf className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">{source.name}</h3>
            <p className="mt-1 break-words text-xs text-muted-foreground">{source.domain} · {t("sourceLanguage")}</p>
          </div></div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(source.description)}</p>
          <Button asChild variant="outline" size="sm" className="mt-3"><a href={source.url} target="_blank" rel="noopener noreferrer">{t(source.action)}<ExternalLink /></a></Button>
        </article>)}
      </div>
    </section>

    <section className="mt-7">
      <h2 className="font-display text-xl">{t("savedInformation")}</h2>
      <dl className="mt-3 divide-y divide-border border-y border-border">
        {facts.map((fact) => <div key={fact.label} className="py-3"><dt className="text-sm font-bold">{fact.label}</dt><dd className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{fact.value}</dd></div>)}
      </dl>
    </section>
    <div className="mt-6 flex items-start gap-3 border-l-2 border-destructive pl-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <p className="text-xs leading-relaxed text-muted-foreground">{t("verificationCaution")}</p>
    </div>
  </AppShell>;
}