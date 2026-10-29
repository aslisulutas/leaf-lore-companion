import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mergeCareFields, missingCareFields } from "./plant-enrichment";
import type { PlantResult } from "./plant-types";
import type { Json } from "@/integrations/supabase/types";

export const completePlantCare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), lang: z.enum(["tr", "en"]) }).parse(input))
  .handler(async ({ data, context }): Promise<PlantResult> => {
    const { data: plant, error } = await context.supabase.from("plants")
      .select("result").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error) throw error;
    if (!plant) throw new Error(data.lang === "en" ? "Record not found." : "Kayıt bulunamadı.");
    const original = plant.result as unknown as PlantResult;
    const missing = missingCareFields(original);
    if (missing.length === 0) return original;
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error(data.lang === "en" ? "AI configuration is missing." : "Yapay zekâ yapılandırması eksik.");
    const { generateMissingCare } = await import("./plant-care.server");
    // Keep existing saved content's language when the viewing language has changed.
    const english = /\b(the|and|water|soil|plant|this|light)\b/i.test([original.description, original.watering, original.soil].join(" "));
    const additions = await generateMissingCare(key, original, missing, english ? "en" : "tr");
    // Re-read to avoid replacing fields already completed by another open tab.
    const { data: latest, error: readError } = await context.supabase.from("plants")
      .select("result").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (readError) throw readError;
    if (!latest) throw new Error(data.lang === "en" ? "Record not found." : "Kayıt bulunamadı.");
    const merged = mergeCareFields(latest.result as unknown as PlantResult, additions);
    const { data: saved, error: saveError } = await context.supabase.from("plants")
      .update({ result: merged as unknown as Json }).eq("id", data.id).eq("user_id", context.userId).select("result").maybeSingle();
    if (saveError) throw saveError;
    if (!saved) throw new Error(data.lang === "en" ? "The changes could not be saved." : "Değişiklikler kaydedilemedi.");
    return saved.result as unknown as PlantResult;
  });