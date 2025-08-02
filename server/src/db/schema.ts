
import { serial, text, pgTable, timestamp, boolean, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for skill levels
export const skillLevelEnum = pgEnum('skill_level', ['Beginner', 'Intermediate', 'Advanced']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Match posts table
export const matchPostsTable = pgTable('match_posts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  team_name: text('team_name').notNull(),
  skill_level: skillLevelEnum('skill_level').notNull(),
  match_date: timestamp('match_date').notNull(),
  location: text('location').notNull(),
  field_name: text('field_name'), // Nullable by default
  contact_info: text('contact_info').notNull(),
  description: text('description'), // Nullable by default
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  matchPosts: many(matchPostsTable),
}));

export const matchPostsRelations = relations(matchPostsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [matchPostsTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type MatchPost = typeof matchPostsTable.$inferSelect;
export type NewMatchPost = typeof matchPostsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  matchPosts: matchPostsTable 
};
