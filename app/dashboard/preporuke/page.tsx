import { getReferralStats } from '@/lib/actions/referrals';
import ReferralCopyButton from '@/components/ReferralCopyButton';
import { Users, Coins, Gift } from 'lucide-react';

export default async function ReferralPage() {
  const stats = await getReferralStats();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Preporuči i zaradi</h1>
      <p className="text-zinc-500 mb-8">Pozovite prijatelje i zaradite kredite za buduće narudžbe.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col items-center text-center">
           <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
             <Coins className="w-6 h-6" />
           </div>
           <h3 className="text-sm font-medium text-zinc-500 mb-1">Dostupni krediti</h3>
           <p className="text-3xl font-bold text-zinc-900">{(stats.creditsCents / 100).toFixed(2)} €</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col items-center text-center">
           <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
             <Users className="w-6 h-6" />
           </div>
           <h3 className="text-sm font-medium text-zinc-500 mb-1">Uspješne preporuke</h3>
           <p className="text-3xl font-bold text-zinc-900">{stats.successfulReferrals}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col items-center text-center">
           <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
             <Gift className="w-6 h-6" />
           </div>
           <h3 className="text-sm font-medium text-zinc-500 mb-1">Zarađeno ukupno</h3>
           <p className="text-3xl font-bold text-zinc-900">{(stats.successfulReferrals * 5).toFixed(2)} €</p>
        </div>
      </div>

      <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-100 mb-8 text-center">
        <h2 className="text-xl font-bold text-indigo-900 mb-4">Vaš jedinstveni kod</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
           <code className="text-3xl font-mono font-bold text-indigo-600 bg-white px-8 py-4 rounded-xl border border-indigo-200 shadow-sm tracking-wider">
             {stats.referralCode}
           </code>
           <ReferralCopyButton code={stats.referralCode || ''} />
        </div>
        <p className="text-indigo-700 max-w-2xl mx-auto">
          Podijelite ovaj kod s prijateljima. Kada oni naprave svoju <strong>prvu narudžbu</strong> koristeći vaš kod, dobivaju <strong>5.00 € popusta</strong>, a vi dobivate <strong>5.00 € kredita</strong> nakon što njihova narudžba bude završena!
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Kako funkcionira?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-zinc-600">1</div>
            <h3 className="font-bold text-zinc-900 mb-2">Podijelite kod</h3>
            <p className="text-sm text-zinc-500">Pošaljite svoj jedinstveni kod prijateljima koji trebaju pomoć s radovima.</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-zinc-600">2</div>
            <h3 className="font-bold text-zinc-900 mb-2">Prijatelj naručuje</h3>
            <p className="text-sm text-zinc-500">Prijatelj unosi kod pri prvoj narudžbi i odmah dobiva 5 € popusta.</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-zinc-600">3</div>
            <h3 className="font-bold text-zinc-900 mb-2">Vi zarađujete</h3>
            <p className="text-sm text-zinc-500">Nakon što prijatelj plati i preuzme rad, vi automatski dobivate 5 € kredita.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
