'use client';

import { SerializedCard, Currency, Shop, ExchangeRates } from '@/lib/types';
import CardItem from './CardItem';

interface SetSectionProps {
  setName: string;
  setCode: string;
  releasedAt: string;
  cards: SerializedCard[];
  currency: Currency;
  shop: Shop;
  exchangeRates: ExchangeRates;
}

export default function SetSection({
  setName,
  setCode,
  releasedAt,
  cards,
  currency,
  shop,
  exchangeRates,
}: SetSectionProps) {
  const year = releasedAt ? releasedAt.substring(0, 4) + '年' : '';
  const label = setName + (year ? ` (${year})` : '');
  const sectionId = 'set-' + setName.replace(/[^A-Za-z0-9]/g, '_');

  return (
    <section className="set-section" id={sectionId}>
      <h2 className="set-title">
        {setCode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://svgs.scryfall.io/sets/${setCode}.svg`}
            alt=""
            className="set-symbol"
          />
        )}
        {label}
      </h2>
      <div className="set-card-grid">
        {cards.map((card, i) => (
          <CardItem
            key={`${card.name}-${card.set}-${i}`}
            card={card}
            currency={currency}
            shop={shop}
            exchangeRates={exchangeRates}
          />
        ))}
      </div>
    </section>
  );
}
