
import { z } from 'zod';

// Enum schemas
export const skillLevelSchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export type SkillLevel = z.infer<typeof skillLevelSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Match post schema
export const matchPostSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  team_name: z.string(),
  skill_level: skillLevelSchema,
  match_date: z.coerce.date(),
  location: z.string(),
  field_name: z.string().nullable(),
  contact_info: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MatchPost = z.infer<typeof matchPostSchema>;

// Input schemas for user operations
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().nullable()
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Input schemas for match post operations
export const createMatchPostInputSchema = z.object({
  user_id: z.number(),
  team_name: z.string().min(1),
  skill_level: skillLevelSchema,
  match_date: z.coerce.date(),
  location: z.string().min(1),
  field_name: z.string().nullable(),
  contact_info: z.string().min(1),
  description: z.string().nullable()
});

export type CreateMatchPostInput = z.infer<typeof createMatchPostInputSchema>;

export const updateMatchPostInputSchema = z.object({
  id: z.number(),
  team_name: z.string().min(1).optional(),
  skill_level: skillLevelSchema.optional(),
  match_date: z.coerce.date().optional(),
  location: z.string().min(1).optional(),
  field_name: z.string().nullable().optional(),
  contact_info: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateMatchPostInput = z.infer<typeof updateMatchPostInputSchema>;

// Filter schema for searching match posts
export const matchPostFiltersSchema = z.object({
  skill_level: skillLevelSchema.optional(),
  location: z.string().optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  is_active: z.boolean().optional()
});

export type MatchPostFilters = z.infer<typeof matchPostFiltersSchema>;

// Authentication response schema
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
