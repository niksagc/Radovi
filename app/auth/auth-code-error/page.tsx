import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-100 text-center">
        <h2 className="text-3xl font-bold text-zinc-900">Greška pri prijavi</h2>
        <p className="text-zinc-600">
          Došlo je do pogreške prilikom potvrde vašeg linka za prijavu. Link je možda istekao ili je već iskorišten.
        </p>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Povratak na prijavu
          </Link>
        </div>
      </div>
    </div>
  );
}
