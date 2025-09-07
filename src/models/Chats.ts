import type { InferSelectModel } from 'drizzle-orm';
import {
    pgTable,
    timestamp,
    uuid,
    text,
  } from 'drizzle-orm/pg-core';
import { users } from './Users';

export const chats = pgTable('chats', {
    chatId: uuid('chat_id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    title: text('title').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId)
  });
  
  export type Chat = InferSelectModel<typeof chats>;