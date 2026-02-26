import type { Metadata } from 'next';
import { fetchCardsForFormat } from '@/lib/scryfall';
import TabBar from '@/components/TabBar';
import CardGrid from '@/components/CardGrid';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtg-common-uncommon-vercel.vercel.app';
const label = '1995〜2003';
const description = `${label}年発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。`;

export const metadata: Metadata = {
  title: `${label} | MTG 高額コモン・アンコモン一覧`,
  description,
  openGraph: {
    title: `${label} | MTG 高額コモン・アンコモン一覧`,
    description,
    url: siteUrl,
    siteName: 'MTG 高額コモン・アンコモン一覧',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title: `${label} | MTG 高額コモン・アンコモン一覧`,
    description,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default async function HomePage() {
  const cards = await fetchCardsForFormat('y1993_2003');

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: siteUrl },
          { name: label, url: siteUrl },
        ]}
      />
      <div className="top-bar">
        <div className="header-compact">
          <h1>Magic: The Gathering Top Common &amp; Uncommon</h1>
        </div>
        <TabBar activeFormat="y1993_2003" />
        <CardGrid cards={cards} format="y1993_2003" />
      </div>
    </main>
  );
}
