import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import { WebSiteJsonLd } from '@/components/JsonLd';
import '@/styles/globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mtg-common-uncommon-vercel.vercel.app';
const siteName = 'MTG 高額コモン・アンコモン一覧';

export const metadata: Metadata = {
  title: siteName,
  description: 'MTGのコモン・アンコモンカードの中から高額カードを年代別・セット別に一覧表示',
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=MedievalSharp&display=swap"
          rel="stylesheet"
        />
        <WebSiteJsonLd siteUrl={siteUrl} siteName={siteName} />
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
