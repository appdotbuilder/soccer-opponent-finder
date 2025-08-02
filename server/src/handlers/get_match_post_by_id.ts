
import { db } from '../db';
import { matchPostsTable } from '../db/schema';
import { type MatchPost } from '../schema';
import { eq } from 'drizzle-orm';

export const getMatchPostById = async (id: number): Promise<MatchPost | null> => {
  try {
    const results = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const matchPost = results[0];
    return {
      ...matchPost,
      // All fields are already in correct types from database schema
      // No numeric conversions needed as there are no numeric columns
    };
  } catch (error) {
    console.error('Get match post by ID failed:', error);
    throw error;
  }
};
