
import { db } from '../db';
import { matchPostsTable } from '../db/schema';
import { type MatchPostFilters, type MatchPost } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getMatchPosts(filters?: MatchPostFilters): Promise<MatchPost[]> {
  try {
    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];

    if (filters) {
      if (filters.skill_level) {
        conditions.push(eq(matchPostsTable.skill_level, filters.skill_level));
      }

      if (filters.location) {
        conditions.push(eq(matchPostsTable.location, filters.location));
      }

      if (filters.date_from) {
        conditions.push(gte(matchPostsTable.match_date, filters.date_from));
      }

      if (filters.date_to) {
        conditions.push(lte(matchPostsTable.match_date, filters.date_to));
      }

      if (filters.is_active !== undefined) {
        conditions.push(eq(matchPostsTable.is_active, filters.is_active));
      }
    }

    // Build and execute query
    const results = conditions.length > 0
      ? await db.select()
          .from(matchPostsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(matchPostsTable)
          .execute();

    return results;
  } catch (error) {
    console.error('Failed to get match posts:', error);
    throw error;
  }
}
