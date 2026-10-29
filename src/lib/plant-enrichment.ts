import type { PlantResult } from "./plant-types";

export const careFields = [
  "watering", "light", "temperature", "humidity", "soil", "fertilizing",
  "pruning", "propagation", "toxicity", "pests", "funFact", "growthTime",
  "bulb", "blooming", "pollen",
] as const;
export type CareField = (typeof careFields)[number];

export function missingCareFields(result: Partial<PlantResult>): CareField[] {
  return careFields.filter((field) => !result[field]?.trim());
}

export function mergeCareFields(result: PlantResult, additions: Partial<Record<CareField, string>>): PlantResult {
  const merged = { ...result };
  for (const field of missingCareFields(result)) {
    const value = additions[field]?.trim();
    if (value) merged[field] = value;
  }
  return merged;
}