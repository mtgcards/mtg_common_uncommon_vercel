import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCardsForFormat } from '@/lib/scryfall';
import { ALL_FORMAT_KEYS, TAB_LABELS } from '@/lib/constants';
import { FormatKey } from '@/lib/types';
import TabBar from '@/components/TabBar';
import CardGrid from '@/components/CardGrid';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtg-common-uncommon-vercel.vercel.app';

const FORMAT_DESCRIPTIONS: Record<FormatKey, string> = {
  y1993_2003: '1995〜2003年発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。',
  y2004_2014: '2004〜2014年発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。',
  y2015_2020: '2015〜2020年発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。',
  y2021_2022: '2021〜2022年発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。',
  y2023_2025: '2023〜2025年発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。',
  y2026_: '2026年以降発売のMTGセットから、$0.80以上のコモン・$2.00以上のアンコモンを年代別・セット別に一覧表示します。',
  basic_land: 'MTGの高額Basic Landカードを$2.50以上の価格帯でセット別に一覧表示します。',
  token: 'MTGの高額トークンカードを$2.50以上の価格帯でセット別に一覧表示します。',
  foil: 'MTGの高額フォイルコモン・アンコモンカードを$10.00以上の価格帯でセット別に一覧表示します。',
};

export function generateStaticParams() {
  return ALL_FORMAT_KEYS
    .filter((key) => key !== 'y1993_2003')
    .map((format) => ({ format }));
}

interface FormatPageProps {
  params: Promise<{ format: string }>;
}

export async function generateMetadata({ params }: FormatPageProps): Promise<Metadata> {
  const { format } = await params;
  const formatKey = format as FormatKey;

  if (!ALL_FORMAT_KEYS.includes(formatKey)) {
    return {};
  }

  const label = TAB_LABELS[formatKey];
  const description = FORMAT_DESCRIPTIONS[formatKey];
  const pageUrl = `${siteUrl}/${format}`;

  return {
    title: `${label} | MTG 高額コモン・アンコモン一覧`,
    description,
    openGraph: {
      title: `${label} | MTG 高額コモン・アンコモン一覧`,
      description,
      url: pageUrl,
      siteName: 'MTG 高額コモン・アンコモン一覧',
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary',
      title: `${label} | MTG 高額コモン・アンコモン一覧`,
      description,
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default async function FormatPage({ params }: FormatPageProps) {
  const { format } = await params;

  if (!ALL_FORMAT_KEYS.includes(format as FormatKey)) {
    notFound();
  }

  if (format === 'y1993_2003') {
    const { redirect } = await import('next/navigation');
    redirect('/');
  }

  const cards = await fetchCardsForFormat(format as FormatKey);
  const formatKey = format as FormatKey;
  const label = TAB_LABELS[formatKey];
  const pageUrl = `${siteUrl}/${format}`;

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: siteUrl },
          { name: label, url: pageUrl },
        ]}
      />
      <div className="top-bar">
        <div className="header-compact">
          <h1>Magic: The Gathering Top Common &amp; Uncommon</h1>
        </div>
        <TabBar activeFormat={formatKey} />
        <CardGrid cards={cards} format={formatKey} />
      </div>
    </main>
  );
}
