import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, BookOpenCheck, ExternalLink, Leaf, Loader2, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getPlant } from "@/lib/plants-db";
import { plantSources } from "@/lib/plant-sources";
import { useLang, type TKey } from "@/lib/i18n";
import { compareWithGbif, fetchSourceComparison, type CompareStatus } from "@/lib/plant-compare";

const statusKey: Record<CompareStatus, TKey> = { match: "cmpMatch", differs: "cmpDiffers", notFound: "cmpNotFound" };
const statusClass: Record<CompareStatus, string> = {
  match: "bg-primary/15 text-primary", differs: "bg-destructive/15 text-destructive", notFound: "bg-muted text-muted-foreground",
};

function AutoComparison({ scientificName, family }: { scientificName: string; family: string }) {
  const { t, lang } = useLang();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["plant-compare", scientificName, lang],
    queryFn: () => fetchSourceComparison(scientificName, lang),
    enabled: !!scientificName.trim(),
    staleTime: 1000 * 60 * 60,
  });
  if (!scientificName.trim()) return null;
  const cmp = data ? compareWithGbif({ scientificName, family }, data.gbif) : null;
  const rows = cmp && data ? [
    { label: t("scientificName"), saved: scientificName, source: data.gbif?.canonicalName, status: cmp.name },
    { label: t("family"), saved: family, source: data.gbif?.family, status: cmp.family },
  ] : [];
  return <section className="mt-7">
    <h2 className="font-display text-xl">{t("autoCompare")}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{t("compareNote")}</p>
    {isPending && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("comparing")}</p>}
    {isError && <div role="alert" className="mt-3 text-sm text-destructive">{t("compareFailed")}
      <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}><RefreshCw />{t("retryLoad")}</Button></div>}
    {data && <div className="mt-3 rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-bold text-foreground">GBIF Backbone Taxonomy</p>
      <dl className="mt-2 divide-y divide-border">
        {rows.map((row) => <div key={row.label} className="py-2">
          <div className="flex items-center justify-between gap-2"><dt className="text-sm font-bold">{row.label}</dt>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass[row.status]}`}>{t(statusKey[row.status])}</span></div>
          <dd className="mt-1 break-words text-xs text-muted-foreground">{t("cmpSaved")}: {row.saved || "—"} · {t("cmpSource")}: {row.source || "—"}</dd>
        </div>)}
      </dl>
      {data.gbif?.usageKey && <a className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline" href={`https://www.gbif.org/species/${data.gbif.usageKey}`} target="_blank" rel="noopener noreferrer">gbif.org<ExternalLink className="h-3 w-3" /></a>}
      {data.wiki && <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-bold text-foreground">{t("wikiSummary")} ({data.wiki.lang.toUpperCase()})</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{data.wiki.extract}</p>
        {data.wiki.url && <a className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline" href={data.wiki.url} target="_blank" rel="noopener noreferrer">wikipedia.org<ExternalLink className="h-3 w-3" /></a>}
      </div>}
    </div>}
  </section>;
}

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

    <AutoComparison scientificName={r.scientificName || ""} family={r.family || ""} />

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