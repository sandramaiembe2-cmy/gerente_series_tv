import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './auth/auth.routes';
import { seriesRoutes } from './series/series.routes';

const app = new Elysia()
  .use(cors())
  .use(swagger({ path: '/docs' }))
  .get('/', () => ({ mensagem: 'API Gerente de Séries de TV no ar' }))
  .use(authRoutes)
  .use(seriesRoutes)
  .listen(Number(process.env.PORT) || 3002);

console.log(`Servidor a correr em http://localhost:${app.server?.port}`);
console.log(`Documentação Swagger em http://localhost:${app.server?.port}/docs`);