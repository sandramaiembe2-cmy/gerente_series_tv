'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';

type Episodio = {
  id: string;
  temporada: number;
  episodio: number;
  visto: boolean;
};

type SerieDetalhe = {
  id: string;
  nome: string;
  temporadas: number;
  episodiosPorTemporada: number;
  episodios: Episodio[];
};

export default function SerieDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [serie, setSerie] = useState<SerieDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const data = await apiFetch(`/series/${params.id}`);
      setSerie(data);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function toggleEpisodio(episodioId: string, vistoAtual: boolean) {
    if (!serie) return;
    await apiFetch(`/series/${serie.id}/episodios/${episodioId}`, {
      method: 'PUT',
      body: JSON.stringify({ visto: !vistoAtual }),
    });
    setSerie({
      ...serie,
      episodios: serie.episodios.map((e) => (e.id === episodioId ? { ...e, visto: !vistoAtual } : e)),
    });
  }

  if (carregando) return <p className="p-6 text-zinc-400">A carregar...</p>;
  if (erro || !serie) return <p className="p-6 text-red-400">{erro || 'Série não encontrada.'}</p>;

  const porTemporada: Record<number, Episodio[]> = {};
  for (const ep of serie.episodios) {
    if (!porTemporada[ep.temporada]) porTemporada[ep.temporada] = [];
    porTemporada[ep.temporada].push(ep);
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="mb-4 inline-block text-sm text-indigo-400 hover:underline">← Voltar ao dashboard</a>
        <h1 className="mb-6 text-2xl font-semibold">{serie.nome}</h1>

        {Object.entries(porTemporada)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([temporada, eps]) => (
            <div key={temporada} className="mb-6 rounded-xl bg-zinc-900 p-5">
              <h2 className="mb-3 font-medium">Temporada {temporada}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {eps
                  .sort((a, b) => a.episodio - b.episodio)
                  .map((ep) => (
                    <label key={ep.id} className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ep.visto}
                        onChange={() => toggleEpisodio(ep.id, ep.visto)}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      Ep. {ep.episodio}
                    </label>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}