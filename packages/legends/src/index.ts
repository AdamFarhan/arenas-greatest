export type Legend = {
  id: string;
  name: string;
  set: string;
};

export const LEGENDS: Legend[] = [
  { id: "ahri-nine-tailed-fox", name: "Ahri, Nine-Tailed Fox", set: "Origins" },
  { id: "annie-dark-child", name: "Annie, Dark Child", set: "Origins" },
  { id: "azir-emperor-of-the-sands", name: "Azir, Emperor of the Sands", set: "Spiritforged" },
  { id: "darius-hand-of-noxus", name: "Darius, Hand of Noxus", set: "Origins" },
  { id: "diana-scorn-of-the-moon", name: "Diana, Scorn of the Moon", set: "Unleashed" },
  { id: "draven-glorious-executioner", name: "Draven, Glorious Executioner", set: "Spiritforged" },
  { id: "ezreal-prodigal-explorer", name: "Ezreal, Prodigal Explorer", set: "Spiritforged" },
  { id: "fiora-grand-duelist", name: "Fiora, Grand Duelist", set: "Spiritforged" },
  { id: "garen-might-of-demacia", name: "Garen, Might of Demacia", set: "Origins" },
  { id: "irelia-blade-dancer", name: "Irelia, Blade Dancer", set: "Spiritforged" },
  { id: "ivern-green-father", name: "Ivern, Green Father", set: "Spiritforged" },
  { id: "jax-grandmaster-at-arms", name: "Jax, Grandmaster at Arms", set: "Spiritforged" },
  { id: "jhin-virtuoso", name: "Jhin, Virtuoso", set: "Spiritforged" },
  { id: "jinx-loose-cannon", name: "Jinx, Loose Cannon", set: "Origins" },
  { id: "kaisa-daughter-of-the-void", name: "Kai'Sa, Daughter of the Void", set: "Origins" },
  { id: "khazix-voidreaver", name: "Kha'Zix, Voidreaver", set: "Unleashed" },
  { id: "leblanc-deceiver", name: "LeBlanc, Deceiver", set: "Spiritforged" },
  { id: "lee-sin-blind-monk", name: "Lee Sin, Blind Monk", set: "Origins" },
  { id: "leona-radiant-dawn", name: "Leona, Radiant Dawn", set: "Origins" },
  { id: "lillia-bashful-bloom", name: "Lillia, Bashful Bloom", set: "Unleashed" },
  { id: "lucian-purifier", name: "Lucian, Purifier", set: "Unleashed" },
  { id: "lux-lady-of-luminosity", name: "Lux, Lady of Luminosity", set: "Origins" },
  { id: "master-yi-wuju-bladesman", name: "Master Yi, Wuju Bladesman", set: "Unleashed" },
  { id: "master-yi-wuju-master", name: "Master Yi, Wuju Master", set: "Origins" },
  { id: "miss-fortune-bounty-hunter", name: "Miss Fortune, Bounty Hunter", set: "Origins" },
  { id: "ornn-fire-below-the-mountain", name: "Ornn, Fire Below the Mountain", set: "Spiritforged" },
  { id: "poppy-keeper-of-the-hammer", name: "Poppy, Keeper of the Hammer", set: "Spiritforged" },
  { id: "pyke-bloodharbor-ripper", name: "Pyke, Bloodharbor Ripper", set: "Unleashed" },
  { id: "reksai-void-burrower", name: "Rek'Sai, Void Burrower", set: "Unleashed" },
  { id: "renata-glasc-chem-baroness", name: "Renata Glasc, Chem-Baroness", set: "Unleashed" },
  { id: "rengar-pridestalker", name: "Rengar, Pridestalker", set: "Unleashed" },
  { id: "rumble-mechanized-menace", name: "Rumble, Mechanized Menace", set: "Spiritforged" },
  { id: "sett-the-boss", name: "Sett, The Boss", set: "Origins" },
  { id: "sivir-battle-mistress", name: "Sivir, Battle Mistress", set: "Unleashed" },
  { id: "teemo-swift-scout", name: "Teemo, Swift Scout", set: "Origins" },
  { id: "vex-gloomist", name: "Vex, Gloomist", set: "Unleashed" },
  { id: "vi-piltover-enforcer", name: "Vi, Piltover Enforcer", set: "Unleashed" },
  { id: "viktor-herald-of-the-arcane", name: "Viktor, Herald of the Arcane", set: "Origins" },
  { id: "volibear-relentless-storm", name: "Volibear, Relentless Storm", set: "Origins" },
  { id: "yasuo-unforgiven", name: "Yasuo, Unforgiven", set: "Origins" }
];

export function getLegendById(id: string): Legend | undefined {
  return LEGENDS.find((legend) => legend.id === id);
}
