import { supabase } from "@/integrations/supabase/client";
import type { PlantResult } from "./plant-types";

export type PlantRow = { id: string; image: string; result: PlantResult; created_at: string; favorite: boolean; note: string | null };

const COLS = "id, image, result, created_at, favorite, note";

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
