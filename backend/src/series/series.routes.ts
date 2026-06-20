import { Elysia, t } from 'elysia';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { series, episodios } from '../db/schema';
import { jwtPlugin } from '../auth/jwt.plugin';

export const seriesRoutes = new Elysia({ prefix: '/series' })
  .use(jwtPlugin)
  .derive(async ({ headers, jwt }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { userId: null as string | null };
    }
    const payload = await jwt.verify(authHeader.slice(7));
    if (!payload) {
      return { userId: null as string | null };
    }
    return { userId: payload.sub as string };
  })
  .onBeforeHandle(({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { erro: 'Não autenticado. Envia o header Authorization: Bearer <token>.' };
    }
  })
  .get('/', async ({ userId }) => {
    const minhasSeries = await db.select().from(series).where(eq(series.userId, userId!));
    const resultado = [];
    for (const s of minhasSeries) {
      const eps = await db.select().from(episodios).where(eq(episodios.serieId, s.id));
      const total = eps.length;
      const vistos = eps.filter((e) => e.visto).length;
      const progresso = total > 0 ? Math.round((vistos / total) * 100) : 0;
      const estado = progresso === 0 ? 'pendente' : progresso === 100 ? 'visualizado' : 'assistindo_agora';
      resultado.push({ ...s, progresso, estado, episodiosVistos: vistos, episodiosTotal: total });
    }
    return resultado;
  })
  .post(
    '/',
    async ({ body, userId, set }) => {
      const [novaSerie] = await db.insert(series).values({ ...body, userId: userId! }).returning();
      if (!novaSerie) {
        set.status = 500;
        return { erro: 'Não foi possível criar a série.' };
      }
      const linhas = [];
      for (let t = 1; t <= novaSerie.temporadas; t++) {
        for (let e = 1; e <= novaSerie.episodiosPorTemporada; e++) {
          linhas.push({ serieId: novaSerie.id, temporada: t, episodio: e });
        }
      }
      if (linhas.length > 0) {
        await db.insert(episodios).values(linhas);
      }
      set.status = 201;
      return novaSerie;
    },
    {
      body: t.Object({
        nome: t.String(),
        temporadas: t.Number({ minimum: 1 }),
        episodiosPorTemporada: t.Number({ minimum: 1 }),
      }),
    }
  )
  .get('/:id', async ({ params, userId, set }) => {
    const [serieItem] = await db
      .select()
      .from(series)
      .where(and(eq(series.id, params.id), eq(series.userId, userId!)));
    if (!serieItem) {
      set.status = 404;
      return { erro: 'Série não encontrada.' };
    }
    const eps = await db.select().from(episodios).where(eq(episodios.serieId, serieItem.id));
    return { ...serieItem, episodios: eps };
  })
  .put(
    '/:id',
    async ({ params, body, userId, set }) => {
      const [atualizado] = await db
        .update(series)
        .set({ ...body, updatedAt: new Date() })
        .where(and(eq(series.id, params.id), eq(series.userId, userId!)))
        .returning();
      if (!atualizado) {
        set.status = 404;
        return { erro: 'Série não encontrada.' };
      }
      return atualizado;
    },
    {
      body: t.Partial(
        t.Object({
          nome: t.String(),
          temporadas: t.Number({ minimum: 1 }),
          episodiosPorTemporada: t.Number({ minimum: 1 }),
        })
      ),
    }
  )
  .delete('/:id', async ({ params, userId, set }) => {
    const [removido] = await db
      .delete(series)
      .where(and(eq(series.id, params.id), eq(series.userId, userId!)))
      .returning();
    if (!removido) {
      set.status = 404;
      return { erro: 'Série não encontrada.' };
    }
    return { mensagem: 'Removida com sucesso.' };
  })
  .put(
    '/:id/episodios/:episodioId',
    async ({ params, userId, body, set }) => {
      const [serieItem] = await db
        .select()
        .from(series)
        .where(and(eq(series.id, params.id), eq(series.userId, userId!)));
      if (!serieItem) {
        set.status = 404;
        return { erro: 'Série não encontrada.' };
      }
      const [atualizado] = await db
        .update(episodios)
        .set({ visto: body.visto })
        .where(and(eq(episodios.id, params.episodioId), eq(episodios.serieId, params.id)))
        .returning();
      if (!atualizado) {
        set.status = 404;
        return { erro: 'Episódio não encontrado.' };
      }
      return atualizado;
    },
    { body: t.Object({ visto: t.Boolean() }) }
  );