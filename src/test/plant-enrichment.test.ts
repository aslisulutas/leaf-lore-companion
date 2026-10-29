import { describe, expect, it } from "vitest";
import { careFields, mergeCareFields, missingCareFields } from "@/lib/plant-enrichment";
import type { PlantResult } from "@/lib/plant-types";

const complete = {
  ...Object.fromEntries(careFields.map((field) => [field, `Saved ${field}`])),
  isPlant: true, commonName: "Deve Tabanı", scientificName: "Monstera deliciosa",
  family: "Araceae", confidence: 98, description: "Saved description",
} as PlantResult;

describe("Old plant care enrichment", () => {
  for (const field of ["growthTime", "soil", "bulb", "blooming", "pollen", "toxicity"] as const) {
    it(`completes a missing ${field} without replacing existing information`, () => {
      const old = { ...complete, [field]: "" };
      expect(missingCareFields(old)).toEqual([field]);
      expect(mergeCareFields(old, { [field]: "New information", watering: "Replace watering" }))
        .toEqual({ ...complete, [field]: "New information" });
    });
  }
  it("leaves already complete plants unchanged", () => {
    expect(missingCareFields(complete)).toEqual([]);
    expect(mergeCareFields(complete, { bulb: "Replacement" })).toEqual(complete);
  });
  it("detects absent fields in legacy records and rejects empty additions", () => {
    const { growthTime, bulb, blooming, pollen, ...legacy } = complete;
    expect(missingCareFields(legacy)).toEqual(["growthTime", "bulb", "blooming", "pollen"]);
    expect(mergeCareFields(legacy as PlantResult, { growthTime: "  " }).growthTime).toBeUndefined();
  });
});