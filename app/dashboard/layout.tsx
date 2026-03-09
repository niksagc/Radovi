import { logout } from '@/app/login/actions';
import UserHeader from './UserHeader';
import Footer from '@/components/Footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="sticky top-0 z-50 w-full">
        <UserHeader logoutAction={logout} />
      </div>
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
