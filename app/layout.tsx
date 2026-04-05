import type {Metadata} from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css'; // Global styles
import AIAssistant from '@/components/AIAssistant';
import ProfileSync from '@/components/ProfileSync';
import DiscountBanner from '@/components/DiscountBanner';

export const metadata: Metadata = {
  title: 'StudyWorks',
  description: 'Pomoć pri uređivanju i formatiranju školskih dokumenata',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="hr">
      <body suppressHydrationWarning>
        <DiscountBanner />
        {children}
        <ProfileSync />
        <AIAssistant />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
