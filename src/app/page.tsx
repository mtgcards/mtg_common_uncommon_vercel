import type { Metadata } from 'next';
import { fetchCardsForFormat } from '@/lib/scryfall';
import { SITE_URL, DEFAULT_FORMAT } from '@/lib/constants';
import TabBar from '@/components/TabBar';
import CardGrid from '@/components/CardGrid';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

export const revalidate = 3600;

const label = '1995〜2003';
const description = `${label}年発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。`;

export const metadata: Metadata = {
  title: `${label} | MTG 高額コモン・アンコモン一覧`,
  description,
  openGraph: {
    title: `${label} | MTG 高額コモン・アンコモン一覧`,
    description,
    url: SITE_URL,
    siteName: 'MTG 高額コモン・アンコモン一覧',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title: `${label} | MTG 高額コモン・アンコモン一覧`,
    description,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function HomePage() {
  const cards = await fetchCardsForFormat(DEFAULT_FORMAT);

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: SITE_URL },
          { name: label, url: SITE_URL },
        ]}
      />
      <div className="top-bar">
        <div className="header-compact">
          <h1>Magic: The Gathering Top Common &amp; Uncommon</h1>
        </div>
        <TabBar activeFormat={DEFAULT_FORMAT} />
        <CardGrid cards={cards} format={DEFAULT_FORMAT} />
      </div>
    </main>
  );
}
