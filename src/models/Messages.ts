import type { InferSelectModel } from 'drizzle-orm';
import {
    pgTable,
    varchar,
    timestamp,
    json,
    uuid,
  } from 'drizzle-orm/pg-core';
import { chats } from './Chats';

export const messages = pgTable('messages', {
  messageId: uuid('message_id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chats.chatId),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
  metadata: json('metadata')
});
  
  export type DBMessage = InferSelectModel<typeof messages>;