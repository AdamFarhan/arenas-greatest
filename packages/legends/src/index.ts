export type Legend = {
  id: string;
  name: string;
  set: string;
};

export const LEGENDS: Legend[] = [
  { id: "ahri", name: "Ahri", set: "Origins" },
  { id: "darius", name: "Darius", set: "Origins" },
  { id: "garen", name: "Garen", set: "Origins" },
  { id: "jinx", name: "Jinx", set: "Origins" },
  { id: "lux", name: "Lux", set: "Origins" },
  { id: "master-yi", name: "Master Yi", set: "Origins" },
  { id: "yasuo", name: "Yasuo", set: "Origins" },
  { id: "vi", name: "Vi", set: "Origins" }
];

export function getLegendById(id: string): Legend | undefined {
  return LEGENDS.find((legend) => legend.id === id);
}
