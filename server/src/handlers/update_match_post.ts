
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { matchPostsTable } from '../db/schema';
import { type UpdateMatchPostInput, type MatchPost } from '../schema';

export async function updateMatchPost(input: UpdateMatchPostInput): Promise<MatchPost> {
  try {
    // Check if match post exists
    const existingPosts = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, input.id))
      .execute();

    if (existingPosts.length === 0) {
      throw new Error(`Match post with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.team_name !== undefined) {
      updateData.team_name = input.team_name;
    }
    if (input.skill_level !== undefined) {
      updateData.skill_level = input.skill_level;
    }
    if (input.match_date !== undefined) {
      updateData.match_date = input.match_date;
    }
    if (input.location !== undefined) {
      updateData.location = input.location;
    }
    if (input.field_name !== undefined) {
      updateData.field_name = input.field_name;
    }
    if (input.contact_info !== undefined) {
      updateData.contact_info = input.contact_info;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the match post
    const result = await db.update(matchPostsTable)
      .set(updateData)
      .where(eq(matchPostsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Match post update failed:', error);
    throw error;
  }
}
