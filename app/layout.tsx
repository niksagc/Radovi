import type {Metadata} from 'next';
import './globals.css'; // Global styles
import AIAssistant from '@/components/AIAssistant';
import ProfileSync from '@/components/ProfileSync';

export const metadata: Metadata = {
  title: 'StudyWorks',
  description: 'Pomoć pri uređivanju i formatiranju školskih dokumenata',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="hr">
      <body suppressHydrationWarning>
        {children}
        <ProfileSync />
        <AIAssistant />
      </body>
    </html>
  );
}
