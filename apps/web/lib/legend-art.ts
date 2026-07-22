import type { StaticImageData } from "next/image";
import { LEGEND_ART_METADATA, getLegendArtMetadata } from "@riftbound/legend-art";

import ahri_nine_tailed_fox_art from "@riftbound/legend-art/assets/ahri-nine-tailed-fox.png";
import akali_rogue_assassin_art from "@riftbound/legend-art/assets/akali-rogue-assassin.png";
import ambessa_matriarch_of_war_art from "@riftbound/legend-art/assets/ambessa-matriarch-of-war.png";
import annie_dark_child_art from "@riftbound/legend-art/assets/annie-dark-child.png";
import azir_emperor_of_the_sands_art from "@riftbound/legend-art/assets/azir-emperor-of-the-sands.png";
import darius_hand_of_noxus_art from "@riftbound/legend-art/assets/darius-hand-of-noxus.png";
import diana_scorn_of_the_moon_art from "@riftbound/legend-art/assets/diana-scorn-of-the-moon.png";
import draven_glorious_executioner_art from "@riftbound/legend-art/assets/draven-glorious-executioner.png";
import ezreal_prodigal_explorer_art from "@riftbound/legend-art/assets/ezreal-prodigal-explorer.png";
import fiora_grand_duelist_art from "@riftbound/legend-art/assets/fiora-grand-duelist.png";
import garen_might_of_demacia_art from "@riftbound/legend-art/assets/garen-might-of-demacia.png";
import irelia_blade_dancer_art from "@riftbound/legend-art/assets/irelia-blade-dancer.png";
import ivern_green_father_art from "@riftbound/legend-art/assets/ivern-green-father.png";
import jax_grandmaster_at_arms_art from "@riftbound/legend-art/assets/jax-grandmaster-at-arms.png";
import jayce_defender_of_tomorrow_art from "@riftbound/legend-art/assets/jayce-defender-of-tomorrow.png";
import jhin_virtuoso_art from "@riftbound/legend-art/assets/jhin-virtuoso.png";
import jinx_loose_cannon_art from "@riftbound/legend-art/assets/jinx-loose-cannon.png";
import kaisa_daughter_of_the_void_art from "@riftbound/legend-art/assets/kaisa-daughter-of-the-void.png";
import kennen_heart_of_the_tempest_art from "@riftbound/legend-art/assets/kennen-heart-of-the-tempest.png";
import khazix_voidreaver_art from "@riftbound/legend-art/assets/khazix-voidreaver.png";
import leblanc_deceiver_art from "@riftbound/legend-art/assets/leblanc-deceiver.png";
import lee_sin_blind_monk_art from "@riftbound/legend-art/assets/lee-sin-blind-monk.png";
import leona_radiant_dawn_art from "@riftbound/legend-art/assets/leona-radiant-dawn.png";
import lillia_bashful_bloom_art from "@riftbound/legend-art/assets/lillia-bashful-bloom.png";
import lucian_purifier_art from "@riftbound/legend-art/assets/lucian-purifier.png";
import lux_lady_of_luminosity_art from "@riftbound/legend-art/assets/lux-lady-of-luminosity.png";
import master_yi_wuju_bladesman_art from "@riftbound/legend-art/assets/master-yi-wuju-bladesman.png";
import master_yi_wuju_master_art from "@riftbound/legend-art/assets/master-yi-wuju-master.png";
import mel_souls_reflection_art from "@riftbound/legend-art/assets/mel-souls-reflection.png";
import miss_fortune_bounty_hunter_art from "@riftbound/legend-art/assets/miss-fortune-bounty-hunter.png";
import nasus_curator_of_the_sands_art from "@riftbound/legend-art/assets/nasus-curator-of-the-sands.png";
import ornn_fire_below_the_mountain_art from "@riftbound/legend-art/assets/ornn-fire-below-the-mountain.png";
import poppy_keeper_of_the_hammer_art from "@riftbound/legend-art/assets/poppy-keeper-of-the-hammer.png";
import pyke_bloodharbor_ripper_art from "@riftbound/legend-art/assets/pyke-bloodharbor-ripper.png";
import reksai_void_burrower_art from "@riftbound/legend-art/assets/reksai-void-burrower.png";
import renata_glasc_chem_baroness_art from "@riftbound/legend-art/assets/renata-glasc-chem-baroness.png";
import renekton_butcher_of_the_sands_art from "@riftbound/legend-art/assets/renekton-butcher-of-the-sands.png";
import rengar_pridestalker_art from "@riftbound/legend-art/assets/rengar-pridestalker.png";
import rumble_mechanized_menace_art from "@riftbound/legend-art/assets/rumble-mechanized-menace.png";
import sett_the_boss_art from "@riftbound/legend-art/assets/sett-the-boss.png";
import shen_eye_of_twilight_art from "@riftbound/legend-art/assets/shen-eye-of-twilight.png";
import sivir_battle_mistress_art from "@riftbound/legend-art/assets/sivir-battle-mistress.png";
import teemo_swift_scout_art from "@riftbound/legend-art/assets/teemo-swift-scout.png";
import vex_gloomist_art from "@riftbound/legend-art/assets/vex-gloomist.png";
import vi_piltover_enforcer_art from "@riftbound/legend-art/assets/vi-piltover-enforcer.png";
import viktor_herald_of_the_arcane_art from "@riftbound/legend-art/assets/viktor-herald-of-the-arcane.png";
import volibear_relentless_storm_art from "@riftbound/legend-art/assets/volibear-relentless-storm.png";
import yasuo_unforgiven_art from "@riftbound/legend-art/assets/yasuo-unforgiven.png";
import zed_master_of_shadows_art from "@riftbound/legend-art/assets/zed-master-of-shadows.png";

export { LEGEND_ART_METADATA, getLegendArtMetadata };

export const LEGEND_ART: Record<string, StaticImageData> = {
  "ahri-nine-tailed-fox": ahri_nine_tailed_fox_art,
  "akali-rogue-assassin": akali_rogue_assassin_art,
  "ambessa-matriarch-of-war": ambessa_matriarch_of_war_art,
  "annie-dark-child": annie_dark_child_art,
  "azir-emperor-of-the-sands": azir_emperor_of_the_sands_art,
  "darius-hand-of-noxus": darius_hand_of_noxus_art,
  "diana-scorn-of-the-moon": diana_scorn_of_the_moon_art,
  "draven-glorious-executioner": draven_glorious_executioner_art,
  "ezreal-prodigal-explorer": ezreal_prodigal_explorer_art,
  "fiora-grand-duelist": fiora_grand_duelist_art,
  "garen-might-of-demacia": garen_might_of_demacia_art,
  "irelia-blade-dancer": irelia_blade_dancer_art,
  "ivern-green-father": ivern_green_father_art,
  "jax-grandmaster-at-arms": jax_grandmaster_at_arms_art,
  "jayce-defender-of-tomorrow": jayce_defender_of_tomorrow_art,
  "jhin-virtuoso": jhin_virtuoso_art,
  "jinx-loose-cannon": jinx_loose_cannon_art,
  "kaisa-daughter-of-the-void": kaisa_daughter_of_the_void_art,
  "kennen-heart-of-the-tempest": kennen_heart_of_the_tempest_art,
  "khazix-voidreaver": khazix_voidreaver_art,
  "leblanc-deceiver": leblanc_deceiver_art,
  "lee-sin-blind-monk": lee_sin_blind_monk_art,
  "leona-radiant-dawn": leona_radiant_dawn_art,
  "lillia-bashful-bloom": lillia_bashful_bloom_art,
  "lucian-purifier": lucian_purifier_art,
  "lux-lady-of-luminosity": lux_lady_of_luminosity_art,
  "master-yi-wuju-bladesman": master_yi_wuju_bladesman_art,
  "master-yi-wuju-master": master_yi_wuju_master_art,
  "mel-souls-reflection": mel_souls_reflection_art,
  "miss-fortune-bounty-hunter": miss_fortune_bounty_hunter_art,
  "nasus-curator-of-the-sands": nasus_curator_of_the_sands_art,
  "ornn-fire-below-the-mountain": ornn_fire_below_the_mountain_art,
  "poppy-keeper-of-the-hammer": poppy_keeper_of_the_hammer_art,
  "pyke-bloodharbor-ripper": pyke_bloodharbor_ripper_art,
  "reksai-void-burrower": reksai_void_burrower_art,
  "renata-glasc-chem-baroness": renata_glasc_chem_baroness_art,
  "renekton-butcher-of-the-sands": renekton_butcher_of_the_sands_art,
  "rengar-pridestalker": rengar_pridestalker_art,
  "rumble-mechanized-menace": rumble_mechanized_menace_art,
  "sett-the-boss": sett_the_boss_art,
  "shen-eye-of-twilight": shen_eye_of_twilight_art,
  "sivir-battle-mistress": sivir_battle_mistress_art,
  "teemo-swift-scout": teemo_swift_scout_art,
  "vex-gloomist": vex_gloomist_art,
  "vi-piltover-enforcer": vi_piltover_enforcer_art,
  "viktor-herald-of-the-arcane": viktor_herald_of_the_arcane_art,
  "volibear-relentless-storm": volibear_relentless_storm_art,
  "yasuo-unforgiven": yasuo_unforgiven_art,
  "zed-master-of-shadows": zed_master_of_shadows_art
};

export function getLegendArtSource(legendId: string) {
  return LEGEND_ART[legendId];
}
