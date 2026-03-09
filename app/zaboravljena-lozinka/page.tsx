'use client';

import { useState, useActionState } from 'react';
import { resetPassword } from './actions';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);

  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await resetPassword(formData);
      if (result?.error) {
        return { error: result.error };
      }
      setSuccess(true);
      return { error: null };
    },
    { error: null }
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-100"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
            Zaboravljena lozinka
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600">
            Unesite svoj e-mail kako bismo vam poslali link za ponovno postavljanje lozinke.
          </p>
        </div>
        
        {success ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm text-center">
              Link za ponovno postavljanje lozinke je poslan na vaš e-mail.
            </div>
            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Povratak na prijavu
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" action={action}>
            {state?.error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {state.error}
              </div>
            )}
            
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                  Email adresa
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="email@primjer.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="group relative flex w-full justify-center rounded-xl border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Slanje...' : 'Pošalji link'}
              </button>
            </div>
            
            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-indigo-500">
                Povratak na prijavu
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
