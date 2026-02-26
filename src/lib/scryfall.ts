import { ScryfallCard, ScryfallResponse, SerializedCard, FormatKey } from './types';
import {
  API_BASE, QUERY_FILTERS, SET_FILTERS, QUERY_SUFFIX,
  FORMATS, RATE_LIMIT_DELAY, EXCLUDED_SETS, EXCLUDED_PREFIXES,
} from './constants';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getImageUrl(card: ScryfallCard): string | null {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
  return null;
}

function isExcluded(card: ScryfallCard): boolean {
  if (EXCLUDED_SETS.includes(card.set_name)) return true;
  return EXCLUDED_PREFIXES.some((p) => card.set_name.startsWith(p));
}

function buildUrl(format: string, rarity: string): string {
  return `${API_BASE}?q=r%3A${rarity}${QUERY_FILTERS}+${FORMATS[format]}${QUERY_SUFFIX}`;
}

function serializeCard(card: ScryfallCard, isFoil: boolean): SerializedCard {
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

async function fetchAllPages(
  url: string,
  minPrice: number,
  priceKey: 'usd' | 'usd_foil' = 'usd',
  noEarlyStop = false,
): Promise<ScryfallCard[]> {
  const allFiltered: ScryfallCard[] = [];
  let currentUrl: string | null = url;
  const isFoil = priceKey === 'usd_foil';

  while (currentUrl) {
    const response = await fetch(currentUrl, { next: { revalidate: 3600 } });

    if (response.status === 429) {
      await sleep(60000);
      continue;
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const errData = await response.json();
        if (errData?.details) detail = errData.details;
      } catch { /* ignore */ }
      throw new Error(detail);
    }

    const data: ScryfallResponse = await response.json();
    const cards = data.data || [];

    const filtered = cards.filter((card) => {
      let price = card.prices[priceKey];
      if (!price && isFoil) price = card.prices.eur_foil;
      if (!price || parseFloat(price) < minPrice) return false;
      return !isExcluded(card);
    });

    allFiltered.push(...filtered);

    const reachedLimit = !noEarlyStop && cards.some((card) => {
      const price = card.prices[priceKey];
      if (isFoil) return !price || parseFloat(price!) < minPrice;
      return price !== null && price !== undefined && parseFloat(price) < minPrice;
    });

    if (!reachedLimit && data.has_more && data.next_page) {
      await sleep(RATE_LIMIT_DELAY);
      currentUrl = data.next_page;
    } else {
      currentUrl = null;
    }
  }

  return allFiltered;
}

export async function fetchCardsForFormat(format: FormatKey): Promise<SerializedCard[]> {
  if (format === 'basic_land') {
    const url = `${API_BASE}?q=t%3Abasic${SET_FILTERS}${QUERY_SUFFIX}`;
    const minPrice = 2.50;
    const cards = await fetchAllPages(url, minPrice);
    return cards.map((c) => serializeCard(c, false));
  }

  if (format === 'token') {
    const url = `${API_BASE}?q=%28is%3Atoken+OR+t%3Aemblem%29${SET_FILTERS}${QUERY_SUFFIX}`;
    const minPrice = 2.50;
    const cards = await fetchAllPages(url, minPrice);
    return cards.map((c) => serializeCard(c, false));
  }

  if (format === 'foil') {
    const foilCommonUrl = `${API_BASE}?q=is%3Afoil+r%3Acommon${QUERY_FILTERS}&order=usd&dir=desc&unique=prints`;
    const foilUncommonUrl = `${API_BASE}?q=is%3Afoil+r%3Auncommon${QUERY_FILTERS}&order=usd&dir=desc&unique=prints`;
    const minPrice = 4.50;

    const [commonCards, uncommonCards] = await Promise.all([
      fetchAllPages(foilCommonUrl, minPrice, 'usd_foil'),
      fetchAllPages(foilUncommonUrl, minPrice, 'usd_foil'),
    ]);

    return [
      ...commonCards.map((c) => serializeCard(c, true)),
      ...uncommonCards.map((c) => serializeCard(c, true)),
    ];
  }

  // Year-based format: fetch common + uncommon
  const commonUrl = buildUrl(format, 'common');
  const uncommonUrl = buildUrl(format, 'uncommon');
  const commonMinPrice = 0.80;
  const uncommonMinPrice = 2.00;

  const commonCards = await fetchAllPages(commonUrl, commonMinPrice);
  await sleep(RATE_LIMIT_DELAY);
  const uncommonCards = await fetchAllPages(uncommonUrl, uncommonMinPrice);

  return [
    ...commonCards.map((c) => serializeCard(c, false)),
    ...uncommonCards.map((c) => serializeCard(c, false)),
  ];
}
