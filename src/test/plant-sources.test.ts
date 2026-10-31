import { describe, expect, it } from "vitest";
import { plantSources } from "@/lib/plant-sources";

describe("Independent plant source links", () => {
  it("uses the saved scientific name in external botanical searches", () => {
    const sources = plantSources("  Monstera deliciosa  ");
    expect(new URL(sources[0].url).searchParams.get("q")).toBe("Monstera deliciosa");
    expect(new URL(sources[1].url).searchParams.get("query")).toBe("Monstera deliciosa");
  });

  it("keeps special characters inside the name parameter", () => {
    const sources = plantSources("Rosa & test?name=1");
    const url = new URL(sources[0].url);
    expect(url.searchParams.get("q")).toBe("Rosa & test?name=1");
    expect([...url.searchParams.keys()]).toEqual(["q"]);
  });

  it("offers source directories when the name is missing", () => {
    const sources = plantSources("");
    expect(sources[0].url).toBe("https://powo.science.kew.org/");
    expect(sources[2].url).toBe("https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants");
  });
});