'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';

export default function Home() {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    setAutenticado(!!getToken());
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <span className="text-lg font-semibold">Gerente de Séries de TV</span>
        <div className="flex gap-3">
          {autenticado ? (
            <a href="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">Dashboard</a>
          ) : (
            <>
              <a href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white">Entrar</a>
              <a href="/registo" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">Criar conta</a>
            </>
          )}
        </div>
      </nav>

      <main className="flex flex-col items-center px-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">Nunca mais percas o fio à série que estás a ver</h1>
        <p className="mt-4 max-w-xl text-zinc-400">
          Regista as tuas séries, define temporadas e episódios, e marca exatamente o que já viste.
          Acompanha o progresso de cada série em tempo real.
        </p>
        <div className="mt-8 flex gap-4">
          {autenticado ? (
            <a href="/dashboard" className="rounded-lg bg-indigo-600 px-6 py-3 font-medium hover:bg-indigo-500">Ir para o Dashboard</a>
          ) : (
            <>
              <a href="/registo" className="rounded-lg bg-indigo-600 px-6 py-3 font-medium hover:bg-indigo-500">Começar agora</a>
              <a href="/login" className="rounded-lg bg-zinc-800 px-6 py-3 font-medium hover:bg-zinc-700">Já tenho conta</a>
            </>
          )}
        </div>
      </main>

      <section className="grid gap-6 border-t border-zinc-800 px-6 py-16 sm:grid-cols-3">
        <div className="rounded-xl bg-zinc-900 p-6">
          <h3 className="mb-2 font-semibold">Progresso por episódio</h3>
          <p className="text-sm text-zinc-400">Marca cada episódio como visto e acompanha a percentagem de progresso da série.</p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-6">
          <h3 className="mb-2 font-semibold">Organização por estado</h3>
          <p className="text-sm text-zinc-400">Separa as séries entre Visualizando, Pendente e Visualizações, com pesquisa por nome.</p>
        </div>
        <div className="rounded-xl bg-zinc-900 p-6">
          <h3 className="mb-2 font-semibold">Conta pessoal e segura</h3>
          <p className="text-sm text-zinc-400">Cada utilizador tem a sua própria lista de séries, protegida por autenticação JWT.</p>
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-xs text-zinc-500">
        Projeto académico — Aplicações Web I
      </footer>
    </div>
  );
}