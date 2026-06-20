'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-zinc-900 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Entrar</h1>
        {erro && <p className="rounded bg-red-500/10 p-2 text-sm text-red-400">{erro}</p>}
        <input className="w-full rounded-lg bg-zinc-800 p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-lg bg-zinc-800 p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={carregando} className="w-full rounded-lg bg-indigo-600 p-3 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50">
          {carregando ? 'A entrar...' : 'Entrar'}
        </button>
        <p className="text-center text-sm text-zinc-400">
          Não tens conta? <a href="/registo" className="text-indigo-400 hover:underline">Criar conta</a>
        </p>
      </form>
    </main>
  );
}