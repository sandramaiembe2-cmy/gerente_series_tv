import { pgTable, varchar, integer, boolean, timestamp, uuid, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const series = pgTable('series', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nome: varchar('nome', { length: 200 }).notNull(),
  temporadas: integer('temporadas').notNull(),
  episodiosPorTemporada: integer('episodios_por_temporada').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const episodios = pgTable('episodios', {
  id: uuid('id').defaultRandom().primaryKey(),
  serieId: uuid('serie_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
  temporada: integer('temporada').notNull(),
  episodio: integer('episodio').notNull(),
  visto: boolean('visto').notNull().default(false),
}, (table) => ({
  unq: unique().on(table.serieId, table.temporada, table.episodio),
}));