export type PlantResult = {
  isPlant: boolean;
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number;
  description: string;
  watering: string;
  light: string;
  temperature: string;
  humidity: string;
  soil: string;
  fertilizing: string;
  pruning: string;
  propagation: string;
  toxicity: string;
  pests: string;
  funFact: string;
};

export type HistoryItem = { id: string; date: number; image: string; result: PlantResult };

const KEY = "plant-history";

export function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveItem(item: HistoryItem) {
  let list = [item, ...loadHistory()].slice(0, 30);
  for (;;) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return;
    } catch {
      if (list.length <= 1) return;
      list = list.slice(0, -1);
    }
  }
}

export function deleteItem(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadHistory().filter((h) => h.id !== id)));
}

export async function resizeImage(file: File, max: number, quality = 0.85): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => bad(new Error("Görsel okunamadı"));
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
