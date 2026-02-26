import { Readable } from 'node:stream';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { SerializedCard, FormatKey } from './types';
import { EXCLUDED_SETS, EXCLUDED_PREFIXES } from './constants';

// Set codes excluded via Scryfall query filters
const EXCLUDED_SET_CODES = new Set([
  'lea', 'leb', 'unk', '30a', 'ced', 'cei', 'ptc',
  'sld', 'slp', 'slc', 'slu', 'pssc',
]);

// Date ranges for year-based formats
const DATE_RANGES: Record<string, { start: string; end?: string }> = {
  y1993_2003: { start: '1995-01-01', end: '2003-12-31' },
  y2004_2014: { start: '2004-01-01', end: '2014-12-31' },
  y2015_2020: { start: '2015-01-01', end: '2020-12-31' },
  y2021_2022: { start: '2021-01-01', end: '2022-12-31' },
  y2023_2025: { start: '2023-01-01', end: '2025-12-31' },
  y2026_: { start: '2026-01-01' },
};

interface BulkCard {
  name: string;
  set: string;
  set_name: string;
  rarity: string;
  released_at: string;
  type_line: string;
  layout: string;
  border_color: string;
  prices: {
    usd: string | null;
    usd_foil: string | null;
    eur: string | null;
    eur_foil: string | null;
  };
  image_uris?: {
    normal: string;
    small: string;
    large: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal: string;
      small: string;
      large: string;
    };
  }>;
}

// --- Filter helpers ---

function isExcludedSet(card: BulkCard): boolean {
  if (EXCLUDED_SET_CODES.has(card.set)) return true;
  if (EXCLUDED_SETS.includes(card.set_name)) return true;
  return EXCLUDED_PREFIXES.some((p) => card.set_name.startsWith(p));
}

function isGoldBorder(card: BulkCard): boolean {
  return card.border_color === 'gold';
}

function isBasicType(card: BulkCard): boolean {
  return card.type_line?.toLowerCase().includes('basic') ?? false;
}

function isTokenCard(card: BulkCard): boolean {
  return card.layout === 'token';
}

function isEmblemType(card: BulkCard): boolean {
  return card.type_line?.toLowerCase().includes('emblem') ?? false;
}

function getUsdPrice(card: BulkCard): number | null {
  return card.prices.usd ? parseFloat(card.prices.usd) : null;
}

function getFoilPrice(card: BulkCard): number | null {
  if (card.prices.usd_foil) return parseFloat(card.prices.usd_foil);
  if (card.prices.eur_foil) return parseFloat(card.prices.eur_foil);
  return null;
}

// --- Serialization ---

function getImageUrl(card: BulkCard): string | null {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
  return null;
}

function serializeCard(card: BulkCard, isFoil: boolean): SerializedCard {
  let priceUsdFoil: number | null = null;
  let priceEurFoil: number | null = null;

  if (isFoil) {
    if (card.prices.usd_foil) {
      priceUsdFoil = parseFloat(card.prices.usd_foil);
    } else if (card.prices.eur_foil) {
      priceEurFoil = parseFloat(card.prices.eur_foil);
    }
  }

  return {
    name: card.name,
    set: card.set,
    setName: card.set_name,
    rarity: card.rarity,
    releasedAt: card.released_at,
    imageUrl: getImageUrl(card),
    priceUsd: card.prices.usd ? parseFloat(card.prices.usd) : null,
    priceUsdFoil,
    priceEurFoil,
  };
}

// --- Streaming bulk data ---

function pushToBucket(buckets: Map<string, BulkCard[]>, key: string, card: BulkCard) {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = [];
    buckets.set(key, bucket);
  }
  bucket.push(card);
}

function categorizeCard(card: BulkCard, buckets: Map<string, BulkCard[]>) {
  if (isExcludedSet(card) || isGoldBorder(card)) return;

  // Basic land → basic_land bucket only
  if (isBasicType(card)) {
    const price = getUsdPrice(card);
    if (price !== null && price >= 2.50) {
      pushToBucket(buckets, 'basic_land', card);
    }
    return;
  }

  // Token / Emblem → token bucket only
  if (isTokenCard(card) || isEmblemType(card)) {
    const price = getUsdPrice(card);
    if (price !== null && price >= 2.50) {
      pushToBucket(buckets, 'token', card);
    }
    return;
  }

  // Only common/uncommon from here
  if (card.rarity !== 'common' && card.rarity !== 'uncommon') return;

  // Year-based formats
  const usdPrice = getUsdPrice(card);
  if (usdPrice !== null && card.released_at) {
    const minPrice = card.rarity === 'common' ? 0.80 : 2.00;
    if (usdPrice >= minPrice) {
      for (const [format, range] of Object.entries(DATE_RANGES)) {
        if (card.released_at < range.start) continue;
        if (range.end && card.released_at > range.end) continue;
        pushToBucket(buckets, format, card);
        break;
      }
    }
  }

  // Foil format
  const foilPrice = getFoilPrice(card);
  if (foilPrice !== null && foilPrice >= 4.50) {
    pushToBucket(buckets, 'foil', card);
  }
}

let cachedResults: Map<string, SerializedCard[]> | null = null;

async function loadBulkData(): Promise<Map<string, SerializedCard[]>> {
  if (cachedResults) return cachedResults;

  const metaRes = await fetch('https://api.scryfall.com/bulk-data/default-cards');
  if (!metaRes.ok) throw new Error(`Bulk data metadata: HTTP ${metaRes.status}`);
  const meta = await metaRes.json();

  const dataRes = await fetch(meta.download_uri);
  if (!dataRes.ok) throw new Error(`Bulk data download: HTTP ${dataRes.status}`);

  // Stream-parse: process each card one-by-one without loading full JSON into memory
  const buckets = new Map<string, BulkCard[]>();

  const pipeline = chain([
    Readable.fromWeb(dataRes.body! as never),
    parser(),
    streamArray(),
  ]);

  for await (const { value } of pipeline as AsyncIterable<{ key: number; value: unknown }>) {
    categorizeCard(value as BulkCard, buckets);
  }

  // Sort and serialize each bucket
  const results = new Map<string, SerializedCard[]>();

  for (const [format, cards] of buckets) {
    const isFoil = format === 'foil';
    const priceGetter = isFoil ? getFoilPrice : getUsdPrice;

    if (format === 'basic_land' || format === 'token') {
      cards.sort((a, b) => (priceGetter(b) ?? 0) - (priceGetter(a) ?? 0));
    } else {
      // Common first (price desc), then uncommon (price desc)
      cards.sort((a, b) => {
        if (a.rarity !== b.rarity) return a.rarity === 'common' ? -1 : 1;
        return (priceGetter(b) ?? 0) - (priceGetter(a) ?? 0);
      });
    }

    results.set(format, cards.map((c) => serializeCard(c, isFoil)));
  }

  cachedResults = results;
  return results;
}

// --- Main export ---

export async function fetchCardsForFormat(format: FormatKey): Promise<SerializedCard[]> {
  const results = await loadBulkData();
  return results.get(format) ?? [];
}
