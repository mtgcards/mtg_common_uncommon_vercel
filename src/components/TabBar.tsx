'use client';

import Link from 'next/link';
import { ALL_FORMAT_KEYS, TAB_LABELS } from '@/lib/constants';
import { FormatKey } from '@/lib/types';

interface TabBarProps {
  activeFormat: FormatKey;
}

export default function TabBar({ activeFormat }: TabBarProps) {
  return (
    <nav className="tab-bar" role="tablist">
      {ALL_FORMAT_KEYS.map((key) => {
        const href = key === 'y1993_2003' ? '/' : `/${key}`;
        return (
          <Link
            key={key}
            href={href}
            className={`tab-btn${key === activeFormat ? ' active' : ''}`}
            role="tab"
          >
            {TAB_LABELS[key]}
          </Link>
        );
      })}
    </nav>
  );
}
