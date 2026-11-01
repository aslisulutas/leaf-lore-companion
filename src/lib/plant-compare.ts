export type CompareStatus = "match" | "differs" | "notFound";

export type GbifMatch = {
  canonicalName?: string; scientificName?: string; family?: string; status?: string;
  matchType?: string; kingdom?: string; usageKey?: number;
};

const norm = (s?: string) => (s ?? "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();

/** Compares saved names with a GBIF backbone match. Never modifies saved data. */
export function compareWithGbif(saved: { scientificName: string; family: string }, gbif: GbifMatch | null) {
  if (!gbif || !gbif.canonicalName || gbif.matchType === "NONE" || gbif.kingdom !== "Plantae") {
    return { name: "notFound" as CompareStatus, family: "notFound" as CompareStatus };
  }
  const savedName = norm(saved.scientificName).split(" ").slice(0, 2).join(" ");
  const name: CompareStatus = savedName === norm(gbif.canonicalName) ? "match" : "differs";
  const savedFamily = norm(saved.family);
  const family: CompareStatus = !gbif.family ? "notFound"
    : savedFamily.includes(norm(gbif.family)) ? "match" : "differs";
  return { name, family };
}

export async function fetchSourceComparison(scientificName: string, lang: "tr" | "en") {
  const q = scientificName.trim();
  if (!q) return { gbif: null, wiki: null };
  const gbifReq = fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(q)}&kingdom=Plantae`)
    .then((r) => (r.ok ? (r.json() as Promise<GbifMatch>) : null)).catch(() => null);
  const gbif = await gbifReq;
  const title = encodeURIComponent((gbif?.canonicalName || q).replace(/ /g, "_"));
  const wikiFetch = async (l: string) => {
    const r = await fetch(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${title}`);
    if (!r.ok) return null;
    const j = await r.json() as { type?: string; extract?: string; content_urls?: { desktop?: { page?: string } } };
    if (j.type !== "standard" || !j.extract) return null;
    return { extract: j.extract, url: j.content_urls?.desktop?.page ?? "", lang: l };
  };
  const wiki = await wikiFetch(lang).catch(() => null) ?? (lang !== "en" ? await wikiFetch("en").catch(() => null) : null);
  return { gbif, wiki };
}
