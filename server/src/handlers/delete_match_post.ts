
import { db } from '../db';
import { matchPostsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteMatchPost(id: number): Promise<{ success: boolean }> {
  try {
    // Delete the match post
    const result = await db.delete(matchPostsTable)
      .where(eq(matchPostsTable.id, id))
      .returning()
      .execute();

    // Return success based on whether a record was deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Match post deletion failed:', error);
    throw error;
  }
}
