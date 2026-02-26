import { SerializedCard, FormatKey } from './types';
import { EXCLUDED_SETS, EXCLUDED_PREFIXES } from './constants';

// Set codes excluded via Scryfall query filters
const EXCLUDED_SET_CODES = new Set([
  'lea', 'leb', 'unk', '30a', 'ced', 'cei', 'ptc',
  'sld', 'slp', 'slc', 'slu', 'pssc',
]);

// Date ranges for year-based formats
const DATE_RANGES: Partial<Record<FormatKey, { start: string; end?: string }>> = {
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

// Module-level cache (persists across pages during a single build process)
let cachedBulkCards: BulkCard[] | null = null;

async function getBulkCards(): Promise<BulkCard[]> {
  if (cachedBulkCards) return cachedBulkCards;

  const metaRes = await fetch('https://api.scryfall.com/bulk-data/default-cards');
  if (!metaRes.ok) throw new Error(`Bulk data metadata fetch failed: HTTP ${metaRes.status}`);
  const meta = await metaRes.json();

  const dataRes = await fetch(meta.download_uri);
  if (!dataRes.ok) throw new Error(`Bulk data download failed: HTTP ${dataRes.status}`);
  cachedBulkCards = await dataRes.json();

  return cachedBulkCards!;
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

function baseExclude(card: BulkCard): boolean {
  return !isExcludedSet(card) && !isGoldBorder(card) && !isBasicType(card) && !isTokenCard(card) && !isEmblemType(card);
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

// --- Main export ---

export async function fetchCardsForFormat(format: FormatKey): Promise<SerializedCard[]> {
  const allCards = await getBulkCards();

  if (format === 'basic_land') {
    const minPrice = 2.50;
    return allCards
      .filter((card) => {
        const price = getUsdPrice(card);
        return isBasicType(card) && !isExcludedSet(card) && !isGoldBorder(card) && price !== null && price >= minPrice;
      })
      .sort((a, b) => getUsdPrice(b)! - getUsdPrice(a)!)
      .map((c) => serializeCard(c, false));
  }

  if (format === 'token') {
    const minPrice = 2.50;
    return allCards
      .filter((card) => {
        const price = getUsdPrice(card);
        return (
          (isTokenCard(card) || isEmblemType(card)) &&
          !isExcludedSet(card) &&
          !isGoldBorder(card) &&
          price !== null &&
          price >= minPrice
        );
      })
      .sort((a, b) => getUsdPrice(b)! - getUsdPrice(a)!)
      .map((c) => serializeCard(c, false));
  }

  if (format === 'foil') {
    const minPrice = 4.50;
    const foilFilter = (rarity: string) => (card: BulkCard) => {
      const price = getFoilPrice(card);
      return card.rarity === rarity && baseExclude(card) && price !== null && price >= minPrice;
    };

    const commonCards = allCards.filter(foilFilter('common'));
    const uncommonCards = allCards.filter(foilFilter('uncommon'));

    return [
      ...commonCards.map((c) => serializeCard(c, true)),
      ...uncommonCards.map((c) => serializeCard(c, true)),
    ];
  }

  // Year-based format
  const dateRange = DATE_RANGES[format];
  if (!dateRange) throw new Error(`Unknown format: ${format}`);

  const commonMinPrice = 0.80;
  const uncommonMinPrice = 2.00;

  const inDateRange = (card: BulkCard) => {
    const date = card.released_at;
    if (!date || date < dateRange.start) return false;
    if (dateRange.end && date > dateRange.end) return false;
    return true;
  };

  const yearFilter = (card: BulkCard) => inDateRange(card) && baseExclude(card);

  const commonCards = allCards
    .filter((card) => {
      const price = getUsdPrice(card);
      return card.rarity === 'common' && yearFilter(card) && price !== null && price >= commonMinPrice;
    })
    .sort((a, b) => getUsdPrice(b)! - getUsdPrice(a)!);

  const uncommonCards = allCards
    .filter((card) => {
      const price = getUsdPrice(card);
      return card.rarity === 'uncommon' && yearFilter(card) && price !== null && price >= uncommonMinPrice;
    })
    .sort((a, b) => getUsdPrice(b)! - getUsdPrice(a)!);

  return [
    ...commonCards.map((c) => serializeCard(c, false)),
    ...uncommonCards.map((c) => serializeCard(c, false)),
  ];
}
