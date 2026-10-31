import type { TKey } from "./i18n";

export function plantSources(scientificName: string) {
  const query = encodeURIComponent(scientificName.trim());
  return [
    {
      id: "kew",
      name: "Kew · Plants of the World Online",
      domain: "powo.science.kew.org",
      description: "taxonomySource" as TKey,
      url: query ? `https://powo.science.kew.org/results?q=${query}` : "https://powo.science.kew.org/",
      action: "openSource" as TKey,
    },
    {
      id: "rhs",
      name: "Royal Horticultural Society",
      domain: "rhs.org.uk",
      description: "careSource" as TKey,
      url: query ? `https://www.rhs.org.uk/plants/search-form?query=${query}` : "https://www.rhs.org.uk/plants/search-form",
      action: "openSource" as TKey,
    },
    {
      id: "aspca",
      name: "ASPCA · Animal Poison Control",
      domain: "aspca.org",
      description: "toxicitySource" as TKey,
      url: "https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants",
      action: "toxicityDirectory" as TKey,
    },
  ];
}