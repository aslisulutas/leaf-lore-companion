import { supabase } from "@/integrations/supabase/client";
import type { PlantResult } from "./plant-types";

export type PlantRow = {
  id: string;
  image: string;
  result: PlantResult;
  created_at: string;
  favorite: boolean;
  note: string | null;
  verification: PlantVerification | null;
  water_interval_days: number | null;
  fertilizer_interval_days: number | null;
  last_watered_at: string | null;
  last_fertilized_at: string | null;
};

export type PlantVerification = { checkedAt: string; gbif: { canonicalName?: string | undefined; family?: string | undefined; status?: string | undefined; usageKey?: number | undefined; nameStatus: string; familyStatus: string } | null; wiki: { extract: string; url: string; lang: string } | null };

export type LogKind = "photo" | "note" | "water" | "fertilize" | "health";

export type PlantLog = { id: string; plant_id: string; kind: LogKind; image: string | null; note: string | null; created_at: string };

const COLS = "id, image, result, created_at, favorite, note, verification, water_interval_days, fertilizer_interval_days, last_watered_at, last_fertilized_at";

export async function listPlants(): Promise<PlantRow[]> {
  const { data, error } = await supabase
    .from("plants")
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlantRow[];
}

export async function getPlant(id: string): Promise<PlantRow | null> {
  const { data, error } = await supabase
    .from("plants")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as PlantRow | null;
}

export async function setFavorite(id: string, favorite: boolean) {
  const { error } = await supabase.from("plants").update({ favorite }).eq("id", id);
  if (error) throw error;
}

export async function setNote(id: string, note: string) {
  const { error } = await supabase.from("plants").update({ note: note.trim() || null }).eq("id", id);
  if (error) throw error;
}

export async function addPlant(image: string, result: PlantResult): Promise<string> {
  const { data, error } = await supabase
    .from("plants")
    .insert({ image, result: result as never })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function removePlant(id: string) {
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw error;
}

/** Stores open-source findings in a separate column; the saved identification is never changed. */
export async function verifyAndSave(id: string, result: PlantResult, lang: "tr" | "en"): Promise<PlantVerification> {
  const { fetchSourceComparison, compareWithGbif } = await import("./plant-compare");
  const { gbif, wiki } = await fetchSourceComparison(result.scientificName ?? "", lang);
  const cmp = compareWithGbif({ scientificName: result.scientificName ?? "", family: result.family ?? "" }, gbif);
  const v: PlantVerification = {
    checkedAt: new Date().toISOString(),
    gbif: gbif?.canonicalName ? { canonicalName: gbif.canonicalName, family: gbif.family, status: gbif.status, usageKey: gbif.usageKey, nameStatus: cmp.name, familyStatus: cmp.family } : null,
    wiki,
  };
  const { error } = await supabase.from("plants").update({ verification: v as never }).eq("id", id);
  if (error) throw error;
  return v;
}

/** Saves the care rhythm used by the watering reminder. */
export async function setSchedule(id: string, patch: { water_interval_days?: number | null; fertilizer_interval_days?: number | null }) {
  const { error } = await supabase.from("plants").update(patch).eq("id", id);
  if (error) throw error;
}

export async function listLogs(plantId: string): Promise<PlantLog[]> {
  const { data, error } = await supabase
    .from("plant_logs")
    .select("id, plant_id, kind, image, note, created_at")
    .eq("plant_id", plantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlantLog[];
}

export async function addLog(plantId: string, kind: LogKind, entry: { image?: string | null; note?: string | null } = {}): Promise<PlantLog> {
  const { data, error } = await supabase
    .from("plant_logs")
    .insert({ plant_id: plantId, kind, image: entry.image ?? null, note: entry.note?.trim() || null })
    .select("id, plant_id, kind, image, note, created_at")
    .single();
  if (error) throw error;
  return data as unknown as PlantLog;
}

export async function removeLog(id: string) {
  const { error } = await supabase.from("plant_logs").delete().eq("id", id);
  if (error) throw error;
}

/** Records a care action: stamps the plant and writes a journal entry. */
export async function markCare(id: string, kind: "water" | "fertilize") {
  const at = new Date().toISOString();
  const patch = kind === "water" ? { last_watered_at: at } : { last_fertilized_at: at };
  const { error } = await supabase.from("plants").update(patch).eq("id", id);
  if (error) throw error;
  return addLog(id, kind);
}
