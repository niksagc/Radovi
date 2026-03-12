'use client';

import { useState, useActionState } from 'react';
import { login } from './actions';
import Link from 'next/link';
import { motion } from 'motion/react';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  
  const [loginState, loginAction, isLoginPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await login(formData);
      if (result?.error) {
        return { error: result.error };
      }
      return { error: null };
    },
    { error: null }
  );

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch('/api/dev/seed');
      const data = await res.json();
      if (data.success) {
        alert('Baza podataka je uspješno inicijalizirana! Sada se možete prijaviti.');
      } else if (data.code === 'TABLES_MISSING') {
        setError('Tablice nisu kreirane u Supabase bazi. Molimo otvorite Supabase SQL Editor i pokrenite SQL skriptu iz datoteke /supabase/migrations/0000_initial.sql.');
      } else {
        setError(data.error || 'Došlo je do pogreške prilikom inicijalizacije.');
      }
    } catch (err: any) {
      setError(err.message || 'Došlo je do pogreške.');
    }
    setSeeding(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-100"
      >
        <div className="flex flex-col items-center">
          <Link href="/">
            <Logo className="mb-4" />
          </Link>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-zinc-900">
            Prijava
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" action={loginAction}>
          {(error || loginState?.error) && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error || loginState?.error}
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-zinc-700">
                Korisničko ime ili email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="ime.prezime ili email@primjer.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Lozinka
                </label>
                <Link href="/zaboravljena-lozinka" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                  Zaboravili ste lozinku?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoginPending || seeding}
              className="group relative flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoginPending ? 'Prijava u tijeku...' : 'Prijavi se'}
            </button>
          </div>
          
          <div className="text-center text-sm text-zinc-600">
            Nemate račun?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Registrirajte se
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
