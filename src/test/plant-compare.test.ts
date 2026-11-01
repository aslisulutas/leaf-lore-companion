import { describe, expect, it } from "vitest";
import { compareWithGbif } from "@/lib/plant-compare";

const gbif = { canonicalName: "Monstera deliciosa", family: "Araceae", kingdom: "Plantae", matchType: "EXACT" };

describe("compareWithGbif", () => {
  it("matches name ignoring author and family text", () => {
    expect(compareWithGbif({ scientificName: "Monstera deliciosa Liebm.", family: "Araceae (Yılan yastığıgiller)" }, gbif))
      .toEqual({ name: "match", family: "match" });
  });
  it("flags a different species", () => {
    expect(compareWithGbif({ scientificName: "Ficus elastica", family: "Moraceae" }, gbif))
      .toEqual({ name: "differs", family: "differs" });
  });
  it("reports not found when GBIF has no plant match", () => {
    expect(compareWithGbif({ scientificName: "X", family: "Y" }, { matchType: "NONE" }).name).toBe("notFound");
  });
});
