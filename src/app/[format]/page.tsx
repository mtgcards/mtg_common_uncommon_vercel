import { notFound } from 'next/navigation';
import { fetchCardsForFormat } from '@/lib/scryfall';
import { ALL_FORMAT_KEYS } from '@/lib/constants';
import { FormatKey } from '@/lib/types';
import TabBar from '@/components/TabBar';
import CardGrid from '@/components/CardGrid';

export const revalidate = 3600;

export function generateStaticParams() {
  return ALL_FORMAT_KEYS
    .filter((key) => key !== 'y1993_2003')
    .map((format) => ({ format }));
}

interface FormatPageProps {
  params: Promise<{ format: string }>;
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

  return (
    <main>
      <div className="top-bar">
        <div className="header-compact">
          <h1>Magic: The Gathering Top Common &amp; Uncommon</h1>
        </div>
        <TabBar activeFormat={format as FormatKey} />
        <CardGrid cards={cards} format={format as FormatKey} />
      </div>
    </main>
  );
}
