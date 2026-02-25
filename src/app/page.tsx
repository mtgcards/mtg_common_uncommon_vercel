import { fetchCardsForFormat } from '@/lib/scryfall';
import TabBar from '@/components/TabBar';
import CardGrid from '@/components/CardGrid';

export const revalidate = 3600;

export default async function HomePage() {
  const cards = await fetchCardsForFormat('y1993_2003');

  return (
    <main>
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
