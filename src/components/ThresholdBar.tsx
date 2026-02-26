'use client';

import { useState, useCallback } from 'react';
import {
  THRESHOLD_OPTIONS,
  THRESHOLD_VISIBILITY,
  DEFAULT_THRESHOLD_KEYS,
  THRESHOLD_LABELS,
  ThresholdKey,
} from '@/lib/constants';
import { FormatKey, Currency, Shop } from '@/lib/types';

interface ThresholdBarProps {
  format: FormatKey;
  onFilterChange: (thresholds: Record<ThresholdKey, number>) => void;
  onCurrencyChange: (currency: Currency) => void;
  onShopChange: (shop: Shop) => void;
}

export default function ThresholdBar({
  format,
  onFilterChange,
  onCurrencyChange,
  onShopChange,
}: ThresholdBarProps) {
  const [thresholds, setThresholds] = useState<Record<ThresholdKey, number>>(() => {
    const initial = {} as Record<ThresholdKey, number>;
    for (const key of Object.keys(THRESHOLD_OPTIONS) as ThresholdKey[]) {
      initial[key] = THRESHOLD_OPTIONS[key].default;
    }
    return initial;
  });

  const visibleKeys = THRESHOLD_VISIBILITY[format] || DEFAULT_THRESHOLD_KEYS;

  const handleThresholdChange = useCallback(
    (key: ThresholdKey, value: number) => {
      const next = { ...thresholds, [key]: value };
      setThresholds(next);
      onFilterChange(next);
    },
    [thresholds, onFilterChange],
  );

  return (
    <div className="price-threshold-bar">
      {(Object.keys(THRESHOLD_OPTIONS) as ThresholdKey[]).map((key) => {
        if (!visibleKeys.includes(key)) return null;
        const opts = THRESHOLD_OPTIONS[key];
        return (
          <label key={key}>
            {THRESHOLD_LABELS[key]}
            <select
              value={thresholds[key]}
              onChange={(e) => handleThresholdChange(key, parseFloat(e.target.value))}
            >
              {opts.values.map((v) => (
                <option key={v} value={v}>
                  ${v.toFixed(2)}
                </option>
              ))}
            </select>
          </label>
        );
      })}
      <label>
        Currency:
        <select onChange={(e) => onCurrencyChange(e.target.value as Currency)} defaultValue="USD">
          <option value="USD">$</option>
          <option value="JPY">¥</option>
          <option value="EUR">€</option>
        </select>
      </label>
      <label>
        Card Link:
        <select onChange={(e) => onShopChange(e.target.value as Shop)} defaultValue="hareruya">
          <option value="hareruya">hareruya</option>
          <option value="cardkingdom">cardkingdom</option>
          <option value="tcgplayer">tcgplayer</option>
        </select>
      </label>
    </div>
  );
}
