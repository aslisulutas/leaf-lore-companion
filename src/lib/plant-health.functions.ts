import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["isPlant", "summary", "severity", "conditions", "immediateActions", "prevention"],
  properties: {
    isPlant: { type: "boolean" },
    summary: { type: "string" },
    severity: { type: "string", enum: ["healthy", "minor", "moderate", "severe", "unknown"] },
    conditions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "likelihood", "symptoms", "treatment"],
        properties: {
          name: { type: "string" },
          likelihood: { type: "string" },
          symptoms: { type: "string" },
          treatment: { type: "string" },
        },
      },
    },
    immediateActions: { type: "array", items: { type: "string" } },
    prevention: { type: "string" },
  },
};

export type HealthResult = {
  isPlant: boolean;
  summary: string;
  severity: "healthy" | "minor" | "moderate" | "severe" | "unknown";
  conditions: { name: string; likelihood: string; symptoms: string; treatment: string }[];
  immediateActions: string[];
  prevention: string;
};

const promptTr = `Sen uzman bir bitki patologusun. Fotoğraftaki yaprağı/bitkiyi incele ve TÜM alanları TÜRKÇE doldur.
- summary: gözlenen belirtilerin 1-2 cümlelik özeti.
- severity: healthy (belirti yok), minor (hafif), moderate (orta), severe (ciddi), unknown (fotoğraf yetersiz).
- conditions: olası nedenler; en olası ilk sırada. Her biri için name (hastalık/zararlı/stres adı), likelihood (yüksek/orta/düşük), symptoms (bu fotoğrafta görünen belirtiler), treatment (uygulanabilir çözüm).
- immediateActions: bugün yapılabilecek 2-4 somut adım.
- prevention: benzer sorunların tekrarını önlemeye yönelik 1-3 cümle.
Kesin teşhis koyamazsın: olasılıkları belirt, belirsizse "unknown" kullan ve fotoğrafı netleştir. Fotoğrafta bitki veya yaprak yoksa isPlant=false yap, diğer alanları boş/boş dizi bırak.`;

const promptEn = `You are an expert plant pathologist. Examine the leaf/plant in the photo and fill ALL fields in ENGLISH.
- summary: 1-2 sentence description of the observed symptoms.
- severity: healthy, minor, moderate, severe, unknown (photo insufficient).
- conditions: possible causes, most likely first. For each: name (disease, pest or stress), likelihood (high/medium/low), symptoms (what is visible in this photo), treatment (actionable fix).
- immediateActions: 2-4 concrete steps to take today.
- prevention: 1-3 sentences on avoiding a recurrence.
You cannot give a definitive diagnosis: state probabilities and use "unknown" when uncertain. If there is no plant or leaf in the photo, set isPlant=false and leave the other fields empty/empty arrays.`;

export const diagnosePlant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        image: z.string().startsWith("data:image/").max(8_000_000),
        plantName: z.string().max(120).default(""),
        lang: z.enum(["tr", "en"]).default("tr"),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<HealthResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error(data.lang === "en" ? "AI configuration is missing." : "Yapay zekâ yapılandırması eksik.");
    const context = data.plantName
      ? (data.lang === "en" ? "The plant is reported as: " : "Bitkinin adı olarak bildirilen: ") + data.plantName
      : "";
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        input: [
          { role: "system", content: data.lang === "en" ? promptEn : promptTr },
          {
            role: "user",
            content: [
              { type: "input_text", text: context || (data.lang === "en" ? "Examine this photo." : "Bu fotoğrafı incele.") },
              { type: "input_image", image_url: data.image },
            ],
          },
        ],
        text: { format: { type: "json_schema", name: "plant_health", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const payload = await res.json().catch(() => null);
      const message =
        typeof payload?.message === "string" ? payload.message : typeof payload?.error?.message === "string" ? payload.error.message : null;
      if (res.status === 402 || res.status === 403) {
        throw new Error(message ?? (data.lang === "en" ? "AI access is currently unavailable." : "Yapay zekâ erişimi şu anda kullanılamıyor."));
      }
      if (res.status === 429) {
        throw new Error(message ?? (data.lang === "en" ? "Too many requests. Please try again later." : "Çok fazla istek. Lütfen biraz sonra tekrar deneyin."));
      }
      throw new Error(message ?? (data.lang === "en" ? "The leaf could not be examined." : "Yaprak incelenemedi."));
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    const consume = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const obj = JSON.parse(payload);
        if (obj?.type === "response.output_text.delta" && typeof obj.delta === "string") text += obj.delta;
      } catch {
        /* ignore non-content events */
      }
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      lines.forEach(consume);
    }
    consume(buf + dec.decode());
    try {
      return JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()) as HealthResult;
    } catch {
      throw new Error(data.lang === "en" ? "The result could not be read. Please try again." : "Sonuç okunamadı. Lütfen tekrar deneyin.");
    }
  });
