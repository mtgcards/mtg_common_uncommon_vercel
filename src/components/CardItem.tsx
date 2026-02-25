'use client';

import { SerializedCard, Currency, Shop, ExchangeRates } from '@/lib/types';

interface CardItemProps {
  card: SerializedCard;
  currency: Currency;
  shop: Shop;
  exchangeRates: ExchangeRates;
}

function getCardLinkUrl(name: string, shop: Shop): string {
  const encoded = encodeURIComponent(name);
  if (shop === 'cardkingdom') {
    return `https://www.cardkingdom.com/catalog/search?filter%5Bname%5D=${encoded}`;
  }
  if (shop === 'tcgplayer') {
    return `https://www.tcgplayer.com/search/magic/product?q=${encoded}&productLineName=magic`;
  }
  return `https://www.hareruyamtg.com/ja/products/search?product=${encoded}`;
}

function convertFromUSD(usdAmount: number, currency: Currency, rates: ExchangeRates): string {
  if (currency === 'JPY' && rates.JPY) {
    return '¥' + Math.round(usdAmount * rates.JPY).toLocaleString('ja-JP');
  }
  if (currency === 'EUR' && rates.EUR) {
    return '€' + (usdAmount * rates.EUR).toFixed(2);
  }
  return '$' + usdAmount.toFixed(2);
}

function formatPrice(card: SerializedCard, currency: Currency, rates: ExchangeRates): string | null {
  if (card.priceUsdFoil !== null) {
    return convertFromUSD(card.priceUsdFoil, currency, rates);
  }
  if (card.priceEurFoil !== null) {
    const eurVal = card.priceEurFoil;
    if (currency === 'JPY' && rates.EUR && rates.JPY) {
      return '¥' + Math.round((eurVal / rates.EUR) * rates.JPY).toLocaleString('ja-JP');
    }
    if (currency === 'USD' && rates.EUR) {
      return '$' + (eurVal / rates.EUR).toFixed(2);
    }
    return '€' + eurVal.toFixed(2);
  }
  if (card.priceUsd !== null) {
    return convertFromUSD(card.priceUsd, currency, rates);
  }
  return null;
}

export default function CardItem({ card, currency, shop, exchangeRates }: CardItemProps) {
  const priceText = formatPrice(card, currency, exchangeRates);
  const href = getCardLinkUrl(card.name, shop);

  return (
    <a
      className={`card rarity-${card.rarity}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="card-image-wrapper">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
          />
        ) : (
          <div className="card-image-placeholder">🃏</div>
        )}
      </div>
      <div className="card-info">
        <h3 className="card-name">{card.name}</h3>
        <p className={priceText ? 'card-price' : 'card-price unavailable'}>
          {priceText || '価格情報なし'}
        </p>
      </div>
    </a>
  );
}
