import { Elysia, t } from 'elysia';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { jwtPlugin } from './jwt.plugin';

const perfilRoutes = new Elysia()
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
      return { erro: 'Não autenticado.' };
    }
  })
  .get('/me', async ({ userId, set }) => {
    const [user] = await db.select().from(users).where(eq(users.id, userId!));
    if (!user) {
      set.status = 404;
      return { erro: 'Utilizador não encontrado.' };
    }
    return { id: user.id, nome: user.nome, email: user.email };
  });

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .post(
    '/registo',
    async ({ body, jwt, set }) => {
      const { nome, email, password } = body;
      const existente = await db.select().from(users).where(eq(users.email, email));
      if (existente.length > 0) {
        set.status = 409;
        return { erro: 'Já existe um utilizador com este email.' };
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const [novoUser] = await db.insert(users).values({ nome, email, passwordHash }).returning();
      if (!novoUser) {
        set.status = 500;
        return { erro: 'Não foi possível criar o utilizador.' };
      }
      const token = await jwt.sign({ sub: novoUser.id, email: novoUser.email });
      set.status = 201;
      return { token, user: { id: novoUser.id, nome: novoUser.nome, email: novoUser.email } };
    },
    {
      body: t.Object({
        nome: t.String({ minLength: 2 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
      }),
    }
  )
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      const { email, password } = body;
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        set.status = 401;
        return { erro: 'Credenciais inválidas.' };
      }
      const senhaCorreta = await bcrypt.compare(password, user.passwordHash);
      if (!senhaCorreta) {
        set.status = 401;
        return { erro: 'Credenciais inválidas.' };
      }
      const token = await jwt.sign({ sub: user.id, email: user.email });
      return { token, user: { id: user.id, nome: user.nome, email: user.email } };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )
  .use(perfilRoutes);