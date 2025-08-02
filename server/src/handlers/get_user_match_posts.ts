
import { db } from '../db';
import { matchPostsTable } from '../db/schema';
import { type MatchPost } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserMatchPosts(userId: number): Promise<MatchPost[]> {
  try {
    const results = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user match posts:', error);
    throw error;
  }
}
