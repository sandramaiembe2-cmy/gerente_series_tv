'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, removeToken, getToken } from '@/lib/api';

type Serie = {
  id: string;
  nome: string;
  temporadas: number;
  episodiosPorTemporada: number;
  progresso: number;
  estado: 'pendente' | 'assistindo_agora' | 'visualizado';
  episodiosVistos: number;
  episodiosTotal: number;
};

const ABAS = [
  { valor: 'assistindo_agora', label: 'Visualizando' },
  { valor: 'pendente', label: 'Pendente' },
  { valor: 'visualizado', label: 'Visualizações' },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [series, setSeries] = useState<Serie[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [aba, setAba] = useState<'todas' | Serie['estado']>('todas');
  const [pesquisa, setPesquisa] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState('');

  const [nome, setNome] = useState('');
  const [temporadas, setTemporadas] = useState('');
  const [episodiosPorTemporada, setEpisodiosPorTemporada] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    carregarSeries();
  }, []);

  async function carregarSeries() {
    setCarregando(true);
    try {
      const data = await apiFetch('/series');
      setSeries(data);
    } catch (err: any) {
      setErro(err.message);
      if (err.message.includes('autenticado')) {
        removeToken();
        router.replace('/login');
      }
    } finally {
      setCarregando(false);
    }
  }

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    try {
      await apiFetch('/series', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          temporadas: Number(temporadas),
          episodiosPorTemporada: Number(episodiosPorTemporada),
        }),
      });
      setNome(''); setTemporadas(''); setEpisodiosPorTemporada('');
      setMostrarForm(false);
      carregarSeries();
    } catch (err: any) {
      setErro(err.message);
    }
  }

  async function handleRemover(id: string) {
    if (!confirm('Remover esta série?')) return;
    await apiFetch(`/series/${id}`, { method: 'DELETE' });
    carregarSeries();
  }

  async function handleGuardarNome(id: string) {
    await apiFetch(`/series/${id}`, { method: 'PUT', body: JSON.stringify({ nome: nomeEditado }) });
    setEditandoId(null);
    carregarSeries();
  }

  function handleSair() {
    removeToken();
    router.replace('/login');
  }

  const seriesFiltradas = series
    .filter((s) => aba === 'todas' || s.estado === aba)
    .filter((s) => s.nome.toLowerCase().includes(pesquisa.toLowerCase()));

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Gerente de Séries de TV</h1>
          <button onClick={handleSair} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">Sair</button>
        </header>

        {erro && <p className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-400">{erro}</p>}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button onClick={() => setAba('todas')} className={`rounded-full px-4 py-1.5 text-sm ${aba === 'todas' ? 'bg-indigo-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>Todas</button>
          {ABAS.map((a) => (
            <button key={a.valor} onClick={() => setAba(a.valor)} className={`rounded-full px-4 py-1.5 text-sm ${aba === a.valor ? 'bg-indigo-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>{a.label}</button>
          ))}
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nome..."
            className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={() => setMostrarForm(!mostrarForm)} className="ml-auto rounded-full bg-emerald-600 px-4 py-1.5 text-sm hover:bg-emerald-500">
            {mostrarForm ? 'Cancelar' : '+ Adicionar Série'}
          </button>
        </div>

        {mostrarForm && (
          <form onSubmit={handleAdicionar} className="mb-6 grid grid-cols-3 gap-3 rounded-xl bg-zinc-900 p-5">
            <input className="col-span-3 rounded-lg bg-zinc-800 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nome da série" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <input className="rounded-lg bg-zinc-800 p-2.5" placeholder="Temporadas" type="number" min={1} value={temporadas} onChange={(e) => setTemporadas(e.target.value)} required />
            <input className="col-span-2 rounded-lg bg-zinc-800 p-2.5" placeholder="Episódios por temporada" type="number" min={1} value={episodiosPorTemporada} onChange={(e) => setEpisodiosPorTemporada(e.target.value)} required />
            <button type="submit" className="col-span-3 rounded-lg bg-indigo-600 p-2.5 font-medium hover:bg-indigo-500">Guardar série</button>
          </form>
        )}

        {carregando ? (
          <p className="text-zinc-400">A carregar...</p>
        ) : seriesFiltradas.length === 0 ? (
          <p className="text-zinc-400">Nenhuma série encontrada.</p>
        ) : (
          <div className="grid gap-3">
            {seriesFiltradas.map((s) => (
              <div key={s.id} className="rounded-xl bg-zinc-900 p-4">
                <div className="flex items-center justify-between">
                  {editandoId === s.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input value={nomeEditado} onChange={(e) => setNomeEditado(e.target.value)} className="flex-1 rounded-lg bg-zinc-800 px-2 py-1.5" />
                      <button onClick={() => handleGuardarNome(s.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm hover:bg-emerald-500">Guardar</button>
                      <button onClick={() => setEditandoId(null)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700">Cancelar</button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">{s.nome}</p>
                      <p className="text-sm text-zinc-400">
                        {s.temporadas} temporada(s) · {s.episodiosVistos}/{s.episodiosTotal} episódios vistos
                      </p>
                    </div>
                  )}
                  {editandoId !== s.id && (
                    <div className="flex items-center gap-2">
                      <a href={`/serie/${s.id}`} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm hover:bg-indigo-500">Ver detalhes</a>
                      <button onClick={() => { setEditandoId(s.id); setNomeEditado(s.nome); }} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700">Editar</button>
                      <button onClick={() => handleRemover(s.id)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20">Excluir</button>
                    </div>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full bg-indigo-600" style={{ width: `${s.progresso}%` }} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {s.progresso}% ·{' '}
                  {s.estado === 'pendente' ? 'Pendente' : s.estado === 'assistindo_agora' ? 'Assistindo agora' : 'Visualizado'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}