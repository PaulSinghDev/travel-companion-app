
import { text, pgTable, timestamp, boolean, integer, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const travelModeEnum = pgEnum('travel_mode', ['flight', 'boat', 'taxi', 'bus', 'train']);
export const documentTypeEnum = pgEnum('document_type', ['passport', 'visa', 'id', 'ticket', 'other']);

// Users table
export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  bio: text('bio'),
  location: text('location'),
  interests: json('interests').$type<string[]>().notNull().default([]),
  is_discoverable: boolean('is_discoverable').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Travel plans table
export const travelPlansTable = pgTable('travel_plans', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  mode: travelModeEnum('mode').notNull(),
  departure_time: timestamp('departure_time').notNull(),
  arrival_time: timestamp('arrival_time').notNull(),
  departure_location: text('departure_location').notNull(),
  arrival_location: text('arrival_location').notNull(),
  booking_reference: text('booking_reference'),
  duration_minutes: integer('duration_minutes'),
  travel_provider: text('travel_provider'),
  additional_info: text('additional_info'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Travel documents table
export const travelDocumentsTable = pgTable('travel_documents', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: documentTypeEnum('type').notNull(),
  file_hash: text('file_hash').notNull(),
  file_url: text('file_url').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Posts table
export const postsTable = pgTable('posts', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  image_urls: json('image_urls').$type<string[]>().notNull().default([]),
  location: text('location'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: text('id').primaryKey(),
  sender_id: text('sender_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  recipient_id: text('recipient_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  travelPlans: many(travelPlansTable),
  travelDocuments: many(travelDocumentsTable),
  posts: many(postsTable),
  sentMessages: many(messagesTable, { relationName: 'sender' }),
  receivedMessages: many(messagesTable, { relationName: 'recipient' }),
}));

export const travelPlansRelations = relations(travelPlansTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [travelPlansTable.user_id],
    references: [usersTable.id],
  }),
}));

export const travelDocumentsRelations = relations(travelDocumentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [travelDocumentsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const postsRelations = relations(postsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [postsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  sender: one(usersTable, {
    fields: [messagesTable.sender_id],
    references: [usersTable.id],
    relationName: 'sender',
  }),
  recipient: one(usersTable, {
    fields: [messagesTable.recipient_id],
    references: [usersTable.id],
    relationName: 'recipient',
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  travelPlans: travelPlansTable,
  travelDocuments: travelDocumentsTable,
  posts: postsTable,
  messages: messagesTable,
};

// TypeScript types for table operations
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type TravelPlan = typeof travelPlansTable.$inferSelect;
export type NewTravelPlan = typeof travelPlansTable.$inferInsert;
export type TravelDocument = typeof travelDocumentsTable.$inferSelect;
export type NewTravelDocument = typeof travelDocumentsTable.$inferInsert;
export type Post = typeof postsTable.$inferSelect;
export type NewPost = typeof postsTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;
