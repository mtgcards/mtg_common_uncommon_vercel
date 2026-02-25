'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SerializedCard, FormatKey, Currency, Shop, ExchangeRates } from '@/lib/types';
import { ThresholdKey } from '@/lib/constants';
import ThresholdBar, { filterCardsByThreshold } from './ThresholdBar';
import SetSection from './SetSection';
import BackToTop from './BackToTop';

interface CardGridProps {
  cards: SerializedCard[];
  format: FormatKey;
}

interface SetGroup {
  setName: string;
  setCode: string;
  releasedAt: string;
  cards: SerializedCard[];
}

function groupBySet(cards: SerializedCard[]): SetGroup[] {
  const map = new Map<string, SetGroup>();
  for (const card of cards) {
    const key = card.setName;
    if (!map.has(key)) {
      map.set(key, {
        setName: card.setName,
        setCode: card.set,
        releasedAt: card.releasedAt,
        cards: [],
      });
    }
    map.get(key)!.cards.push(card);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => (a.releasedAt || '').localeCompare(b.releasedAt || ''));
  return groups;
}

function getDefaultThresholds(): Record<ThresholdKey, number> {
  return {
    common: 0.80,
    uncommon: 2.00,
    basicLand: 2.50,
    token: 2.50,
    foilCommon: 10.00,
    foilUncommon: 10.00,
  };
}

export default function CardGrid({ cards, format }: CardGridProps) {
  const [thresholds, setThresholds] = useState<Record<ThresholdKey, number>>(getDefaultThresholds);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [shop, setShop] = useState<Shop>('hareruya');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ JPY: null, EUR: null });

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=JPY,EUR')
      .then((res) => res.json())
      .then((data) => {
        setExchangeRates({
          JPY: data.rates?.JPY ?? null,
          EUR: data.rates?.EUR ?? null,
        });
      })
      .catch(() => {});
  }, []);

  const handleFilterChange = useCallback((next: Record<ThresholdKey, number>) => {
    setThresholds(next);
  }, []);

  const handleCurrencyChange = useCallback((c: Currency) => {
    setCurrency(c);
  }, []);

  const handleShopChange = useCallback((s: Shop) => {
    setShop(s);
  }, []);

  const filteredCards = useMemo(
    () => filterCardsByThreshold(cards, format, thresholds),
    [cards, format, thresholds],
  );

  const setGroups = useMemo(() => groupBySet(filteredCards), [filteredCards]);

  const setNavLinks = useMemo(
    () =>
      setGroups.map((g) => ({
        id: 'set-' + g.setName.replace(/[^A-Za-z0-9]/g, '_'),
        setName: g.setName,
        setCode: g.setCode,
      })),
    [setGroups],
  );

  return (
    <>
      <ThresholdBar
        format={format}
        onFilterChange={handleFilterChange}
        onCurrencyChange={handleCurrencyChange}
        onShopChange={handleShopChange}
      />

      {setNavLinks.length > 0 && (
        <nav className="set-nav">
          {setNavLinks.map((link) => (
            <a key={link.id} href={`#${link.id}`} className="set-nav-link">
              {link.setCode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://svgs.scryfall.io/sets/${link.setCode}.svg`}
                  alt=""
                  className="set-symbol"
                />
              )}
              <span className="set-nav-text">{link.setName}</span>
            </a>
          ))}
        </nav>
      )}

      <div className="card-grid">
        {setGroups.map((group) => (
          <SetSection
            key={group.setName}
            setName={group.setName}
            setCode={group.setCode}
            releasedAt={group.releasedAt}
            cards={group.cards}
            currency={currency}
            shop={shop}
            exchangeRates={exchangeRates}
          />
        ))}
      </div>

      {filteredCards.length > 0 && (
        <p className="end-message">すべてのカードを表示しました</p>
      )}

      <BackToTop />
    </>
  );
}
