#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const legendsPath = path.join(rootDir, "packages/legends/src/index.ts");
const artDir = path.join(rootDir, "apps/mobile/assets/legend-art");
const manifestPath = path.join(rootDir, "apps/mobile/lib/legend-art-manifest.json");
const assetMapPath = path.join(rootDir, "apps/mobile/lib/legend-art.ts");
const seedPath = path.join(rootDir, "supabase/seed/legends.sql");

const API_BASE_URL = "https://api.riftcodex.com";
const DEFAULT_KNOWN_SETS = [
  { setId: "OGN", name: "Origins" },
  { setId: "SFD", name: "Spiritforged" },
  { setId: "UNL", name: "Unleashed" },
];

const args = new Set(process.argv.slice(2));
const setArgIndex = process.argv.findIndex((arg) => arg === "--set");
const dryRun = args.has("--dry-run");
const refreshAll = args.has("--all");
const requestedSet = setArgIndex >= 0 ? process.argv[setArgIndex + 1]?.toUpperCase() : null;

if (args.has("--help")) {
  console.log(`Usage: npm run sync:legend-art -- [--dry-run] [--all] [--set SET_ID]

Without arguments, compares local known sets with RiftCodex and syncs missing sets.
--dry-run    Preview work without writing files.
--all        Refresh all local known sets plus any missing RiftCodex sets.
--set        Sync one set for debugging or repair.
`);
  process.exit(0);
}

async function main() {
  const legends = parseLegends(await readFile(legendsPath, "utf8"));
  const manifest = await readManifest();
  const localSets = mergeKnownSets(manifest.knownSets);
  const remoteSets = await fetchAllSets();
  const remoteSetIds = new Set(remoteSets.map((set) => set.setId));
  const localSetIds = new Set(localSets.map((set) => set.setId));
  const missingSets = remoteSets.filter((set) => shouldSyncRemoteSet(set, localSetIds));
  const targetSets = chooseTargetSets({ localSets, missingSets, remoteSets });

  const summary = {
    localSets: localSets.map((set) => set.setId),
    remoteSets: remoteSets.map((set) => set.setId),
    targetSets: targetSets.map((set) => set.setId),
    newSets: missingSets.map((set) => set.setId),
    legendsAdded: [],
    artDownloaded: [],
    artAlreadyPresent: [],
    ambiguousMatches: [],
    missingImages: [],
  };

  const nextKnownSets = new Map(localSets.map((set) => [set.setId, set]));
  const nextLegends = dedupeLegends(legends);
  const nextArt = pickExistingArt(manifest.art, nextLegends);
  const knownLegendIds = new Set(nextLegends.map((legend) => legend.id));

  for (const set of targetSets) {
    nextKnownSets.set(set.setId, { setId: set.setId, name: set.name, publishedOn: set.publishedOn });
    const cards = await fetchAllCards(set.setId);
    const legendCards = cards.filter((card) => card.classification?.type === "Legend");
    const bestCardsByName = chooseBestLegendCards(legendCards);

    for (const card of bestCardsByName.values()) {
      const legend = toLegend(card);
      if (!knownLegendIds.has(legend.id)) {
        nextLegends.push(legend);
        knownLegendIds.add(legend.id);
        summary.legendsAdded.push(`${legend.name} (${set.setId})`);
      }

      const artFile = `${legend.id}.png`;
      const artPath = path.join(artDir, artFile);
      if (!card.media?.image_url) {
        summary.missingImages.push(`${legend.name} (${set.setId})`);
        continue;
      }

      const existingArt = nextArt[legend.id];
      if (existingArt && isPromoSet(set.setId) && !requestedSet) {
        summary.artAlreadyPresent.push(existingArt.file);
        continue;
      }

      nextArt[legend.id] = {
        file: artFile,
        legendId: legend.id,
        legendName: legend.name,
        setId: card.set?.set_id ?? set.setId,
        setName: card.set?.label ?? set.name,
        riftcodexCardId: card.id,
        riftboundId: card.riftbound_id,
        imageUrl: card.media.image_url,
        artist: card.media.artist ?? null,
        updatedOn: card.metadata?.updated_on ?? null,
      };

      if (existsSync(artPath) && !refreshAll && !requestedSet) {
        summary.artAlreadyPresent.push(artFile);
      } else {
        if (!dryRun) {
          await downloadFile(card.media.image_url, artPath);
        }
        summary.artDownloaded.push(artFile);
      }
    }

    const ambiguous = findAmbiguousLegendCards(legendCards);
    summary.ambiguousMatches.push(...ambiguous.map((name) => `${name} (${set.setId})`));
  }

  nextLegends.sort((left, right) => left.name.localeCompare(right.name));
  const nextManifest = {
    generatedAt: new Date().toISOString(),
    source: "https://api.riftcodex.com",
    knownSets: [...nextKnownSets.values()].sort(
      (left, right) =>
        String(left.publishedOn ?? "").localeCompare(String(right.publishedOn ?? "")) ||
        left.setId.localeCompare(right.setId),
    ),
    art: Object.fromEntries(Object.entries(nextArt).sort(([left], [right]) => left.localeCompare(right))),
  };

  if (!dryRun) {
    await mkdir(artDir, { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
    await writeFile(assetMapPath, renderAssetMap(nextManifest.art));
    await writeFile(legendsPath, renderLegends(nextLegends));
    await writeFile(seedPath, renderSeed(nextLegends));
  }

  printSummary(summary, dryRun);
}

function parseLegends(source) {
  const matches = [...source.matchAll(/\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*set:\s*"([^"]+)"\s*\}/g)];
  return matches.map((match) => normalizeLegend({ id: match[1], name: match[2], set: match[3] }));
}

function dedupeLegends(legends) {
  const byId = new Map();
  for (const legend of legends) {
    if (!byId.has(legend.id) || isPromoSetName(byId.get(legend.id).set)) {
      byId.set(legend.id, legend);
    }
  }
  return [...byId.values()];
}

function pickExistingArt(art, legends) {
  const legendIds = new Set(legends.map((legend) => legend.id));
  return Object.fromEntries(Object.entries(art ?? {}).filter(([legendId]) => legendIds.has(legendId)));
}

async function readManifest() {
  if (!existsSync(manifestPath)) {
    return { knownSets: DEFAULT_KNOWN_SETS, art: {} };
  }
  return JSON.parse(await readFile(manifestPath, "utf8"));
}

function mergeKnownSets(manifestSets = []) {
  const sets = new Map(DEFAULT_KNOWN_SETS.map((set) => [set.setId, set]));
  for (const set of manifestSets) {
    sets.set(set.setId, set);
  }
  return [...sets.values()];
}

async function fetchAllSets() {
  const response = await fetchJson("/sets?size=100&page=1");
  return response.items.map((set) => ({
    setId: set.set_id,
    name: set.name,
    publishedOn: set.published_on,
    cardCount: set.card_count,
  }));
}

function shouldSyncRemoteSet(set, localSetIds) {
  return !localSetIds.has(set.setId);
}

function chooseTargetSets({ localSets, missingSets, remoteSets }) {
  if (requestedSet) {
    const remoteSet = remoteSets.find((set) => set.setId === requestedSet);
    if (!remoteSet) {
      throw new Error(`RiftCodex does not know set ${requestedSet}.`);
    }
    return [remoteSet];
  }
  if (refreshAll) {
    const targetIds = new Set([...localSets.map((set) => set.setId), ...missingSets.map((set) => set.setId)]);
    return remoteSets.filter((set) => targetIds.has(set.setId));
  }
  return missingSets;
}

async function fetchAllCards(setId) {
  const cards = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchJson(`/cards?set_id=${encodeURIComponent(setId)}&size=100&page=${page}`);
    cards.push(...response.items);
    if (page >= response.pages) break;
  }
  return cards;
}

async function fetchJson(pathname) {
  const response = await fetch(`${API_BASE_URL}${pathname}`);
  if (!response.ok) {
    throw new Error(`RiftCodex request failed: ${response.status} ${response.statusText} ${pathname}`);
  }
  return response.json();
}

function chooseBestLegendCards(cards) {
  const byName = new Map();
  for (const card of cards) {
    const name = normalizeCardLegendName(card.name);
    const current = byName.get(name);
    if (!current || scoreCard(card) > scoreCard(current)) {
      byName.set(name, card);
    }
  }
  return byName;
}

function normalizeCardLegendName(name) {
  return name.replace(/\s+\([^)]+\)$/i, "");
}

function scoreCard(card) {
  if (!card.metadata?.signature && !card.metadata?.overnumbered && !card.metadata?.alternate_art) return 3;
  if (card.metadata?.signature) return 2;
  if (card.metadata?.overnumbered) return 1;
  return 0;
}

function findAmbiguousLegendCards(cards) {
  const counts = new Map();
  for (const card of cards) {
    const name = normalizeCardLegendName(card.name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name);
}

function toLegend(card) {
  const name = normalizeCardLegendName(card.name).replace(" - ", ", ");
  return normalizeLegend({
    id: slugify(name),
    name,
    set: card.set?.label ?? "Unknown",
  });
}

function normalizeLegend(legend) {
  const name = legend.name.replace(/\s+\([^)]+\)$/i, "");
  return {
    id: slugify(name),
    name,
    set: legend.set,
  };
}

function isPromoSet(setId) {
  return setId === "OPP" || setId === "OGS" || setId === "PR" || setId === "JDG";
}

function isPromoSetName(name) {
  return /promotional|proving grounds|organized play|judge/i.test(name);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function downloadFile(url, destination) {
  await mkdir(path.dirname(destination), { recursive: true });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText} ${url}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, bytes);
}

function renderAssetMap(art) {
  const entries = Object.entries(art)
    .filter(([, meta]) => meta.file)
    .map(([legendId, meta]) => `  "${legendId}": require("../assets/legend-art/${meta.file}")`)
    .join(",\n");

  return `import type { ImageSourcePropType } from "react-native";
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
${entries}
};

export const LEGEND_ART_METADATA = manifest.art as Record<string, LegendArtMetadata>;

export function getLegendArtSource(legendId: string) {
  return LEGEND_ART[legendId];
}
`;
}

function renderLegends(legends) {
  const body = legends
    .map((legend) => `  { id: "${legend.id}", name: "${escapeTs(legend.name)}", set: "${escapeTs(legend.set)}" }`)
    .join(",\n");

  return `export type Legend = {
  id: string;
  name: string;
  set: string;
};

export const LEGENDS: Legend[] = [
${body}
];

export function getLegendById(id: string): Legend | undefined {
  return LEGENDS.find((legend) => legend.id === id);
}
`;
}

function renderSeed(legends) {
  const rows = legends
    .map((legend) => `  ('${escapeSql(legend.id)}', '${escapeSql(legend.name)}', '${escapeSql(legend.set)}')`)
    .join(",\n");

  return `insert into public.legends (id, name, set_name) values
${rows}
on conflict (id) do update set
  name = excluded.name,
  set_name = excluded.set_name;
`;
}

function escapeTs(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function printSummary(summary, isDryRun) {
  console.log(isDryRun ? "Legend art sync dry run" : "Legend art sync complete");
  console.log(`Local sets: ${summary.localSets.join(", ") || "none"}`);
  console.log(`RiftCodex sets: ${summary.remoteSets.join(", ") || "none"}`);
  console.log(`Target sets: ${summary.targetSets.join(", ") || "none"}`);
  console.log(`New sets found: ${summary.newSets.join(", ") || "none"}`);
  console.log(`Legends added: ${summary.legendsAdded.length}`);
  for (const legend of summary.legendsAdded) console.log(`  + ${legend}`);
  console.log(`Art downloaded: ${summary.artDownloaded.length}`);
  console.log(`Art already present: ${summary.artAlreadyPresent.length}`);
  console.log(`Ambiguous legend variants reviewed: ${summary.ambiguousMatches.length}`);
  for (const name of summary.ambiguousMatches) console.log(`  * ${name}`);
  console.log(`Missing images: ${summary.missingImages.length}`);
  for (const name of summary.missingImages) console.log(`  ! ${name}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
