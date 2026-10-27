import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PlantResult } from "./plant-types";

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "isPlant", "commonName", "scientificName", "family", "confidence", "description",
    "watering", "light", "temperature", "humidity", "soil", "fertilizing", "pruning",
    "propagation", "toxicity", "pests", "funFact",
  ],
  properties: {
    isPlant: { type: "boolean" },
    commonName: { type: "string" },
    scientificName: { type: "string" },
    family: { type: "string" },
    confidence: { type: "number" },
    description: { type: "string" },
    watering: { type: "string" },
    light: { type: "string" },
    temperature: { type: "string" },
    humidity: { type: "string" },
    soil: { type: "string" },
    fertilizing: { type: "string" },
    pruning: { type: "string" },
    propagation: { type: "string" },
    toxicity: { type: "string" },
    pests: { type: "string" },
    funFact: { type: "string" },
  },
};

const prompt = `Sen uzman bir botanikçisin. Fotoğraftaki bitkiyi tanımla ve TÜM alanları TÜRKÇE doldur.
- confidence: 0-100 arası tahmini güven yüzdesi.
- watering: sulama sıklığı ve miktarı (ör. "Haftada 1 kez, toprak kuruyunca").
- toxicity: evcil hayvanlar ve çocuklar için zehirlilik bilgisi.
- pests: sık görülen hastalık ve zararlılar.
Her alan 1-3 kısa cümle olsun. Fotoğrafta bitki yoksa isPlant=false yap ve diğer alanları boş bırak.`;

export const identifyPlant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ image: z.string().startsWith("data:image/").max(8_000_000) }).parse(input),
  )
  .handler(async ({ data }): Promise<PlantResult> => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error("Yapay zeka yapılandırması eksik.");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        stream: true,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "plant", strict: true, schema },
        },
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) throw new Error("Çok fazla istek. Lütfen biraz sonra tekrar deneyin.");
      if (res.status === 402) throw new Error("Yapay zeka kredisi tükendi. Lütfen kredi ekleyin.");
      throw new Error(`Bitki tanımlanamadı (hata ${res.status}).`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        const t = l.trim();
        if (!t.startsWith("data:")) continue;
        const p = t.slice(5).trim();
        if (p === "[DONE]") continue;
        try {
          text += JSON.parse(p).choices?.[0]?.delta?.content ?? "";
        } catch {
          /* ignore partial */
        }
      }
    }
    const clean = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    try {
      return JSON.parse(clean) as PlantResult;
    } catch {
      throw new Error("Yanıt okunamadı, lütfen tekrar deneyin.");
    }
  });
