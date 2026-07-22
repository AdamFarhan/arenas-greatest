import manifest from "../manifest.json";

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

export const LEGEND_ART_METADATA = manifest.art as Record<string, LegendArtMetadata>;

export function getLegendArtMetadata(legendId: string) {
  return LEGEND_ART_METADATA[legendId];
}
