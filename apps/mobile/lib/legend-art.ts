import type { ImageSourcePropType } from "react-native";
import manifest from "@/lib/legend-art-manifest.json";

export type LegendArtMetadata = {
  file: string;
  legendId: string;
  legendName: string;
  setId: string;
  setName: string;
  riftcodexCardId: string;
  riftboundId: string;
  imageUrl: string;
  artist: string | null;
  updatedOn: string | null;
};

export const LEGEND_ART: Record<string, ImageSourcePropType> = {
  "ahri-nine-tailed-fox": require("../assets/legend-art/ahri-nine-tailed-fox.png"),
  "annie-dark-child": require("../assets/legend-art/annie-dark-child.png"),
  "azir-emperor-of-the-sands": require("../assets/legend-art/azir-emperor-of-the-sands.png"),
  "darius-hand-of-noxus": require("../assets/legend-art/darius-hand-of-noxus.png"),
  "diana-scorn-of-the-moon": require("../assets/legend-art/diana-scorn-of-the-moon.png"),
  "draven-glorious-executioner": require("../assets/legend-art/draven-glorious-executioner.png"),
  "ezreal-prodigal-explorer": require("../assets/legend-art/ezreal-prodigal-explorer.png"),
  "fiora-grand-duelist": require("../assets/legend-art/fiora-grand-duelist.png"),
  "garen-might-of-demacia": require("../assets/legend-art/garen-might-of-demacia.png"),
  "irelia-blade-dancer": require("../assets/legend-art/irelia-blade-dancer.png"),
  "ivern-green-father": require("../assets/legend-art/ivern-green-father.png"),
  "jax-grandmaster-at-arms": require("../assets/legend-art/jax-grandmaster-at-arms.png"),
  "jhin-virtuoso": require("../assets/legend-art/jhin-virtuoso.png"),
  "jinx-loose-cannon": require("../assets/legend-art/jinx-loose-cannon.png"),
  "kaisa-daughter-of-the-void": require("../assets/legend-art/kaisa-daughter-of-the-void.png"),
  "khazix-voidreaver": require("../assets/legend-art/khazix-voidreaver.png"),
  "leblanc-deceiver": require("../assets/legend-art/leblanc-deceiver.png"),
  "lee-sin-blind-monk": require("../assets/legend-art/lee-sin-blind-monk.png"),
  "leona-radiant-dawn": require("../assets/legend-art/leona-radiant-dawn.png"),
  "lillia-bashful-bloom": require("../assets/legend-art/lillia-bashful-bloom.png"),
  "lucian-purifier": require("../assets/legend-art/lucian-purifier.png"),
  "lux-lady-of-luminosity": require("../assets/legend-art/lux-lady-of-luminosity.png"),
  "master-yi-wuju-bladesman": require("../assets/legend-art/master-yi-wuju-bladesman.png"),
  "master-yi-wuju-master": require("../assets/legend-art/master-yi-wuju-master.png"),
  "miss-fortune-bounty-hunter": require("../assets/legend-art/miss-fortune-bounty-hunter.png"),
  "ornn-fire-below-the-mountain": require("../assets/legend-art/ornn-fire-below-the-mountain.png"),
  "poppy-keeper-of-the-hammer": require("../assets/legend-art/poppy-keeper-of-the-hammer.png"),
  "pyke-bloodharbor-ripper": require("../assets/legend-art/pyke-bloodharbor-ripper.png"),
  "reksai-void-burrower": require("../assets/legend-art/reksai-void-burrower.png"),
  "renata-glasc-chem-baroness": require("../assets/legend-art/renata-glasc-chem-baroness.png"),
  "rengar-pridestalker": require("../assets/legend-art/rengar-pridestalker.png"),
  "rumble-mechanized-menace": require("../assets/legend-art/rumble-mechanized-menace.png"),
  "sett-the-boss": require("../assets/legend-art/sett-the-boss.png"),
  "sivir-battle-mistress": require("../assets/legend-art/sivir-battle-mistress.png"),
  "teemo-swift-scout": require("../assets/legend-art/teemo-swift-scout.png"),
  "vex-gloomist": require("../assets/legend-art/vex-gloomist.png"),
  "vi-piltover-enforcer": require("../assets/legend-art/vi-piltover-enforcer.png"),
  "viktor-herald-of-the-arcane": require("../assets/legend-art/viktor-herald-of-the-arcane.png"),
  "volibear-relentless-storm": require("../assets/legend-art/volibear-relentless-storm.png"),
  "yasuo-unforgiven": require("../assets/legend-art/yasuo-unforgiven.png")
};

export const LEGEND_ART_METADATA = manifest.art as Record<string, LegendArtMetadata>;

export function getLegendArtSource(legendId: string) {
  return LEGEND_ART[legendId];
}
