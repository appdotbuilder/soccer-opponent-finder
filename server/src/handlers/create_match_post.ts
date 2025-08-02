
import { db } from '../db';
import { matchPostsTable, usersTable } from '../db/schema';
import { type CreateMatchPostInput, type MatchPost } from '../schema';
import { eq } from 'drizzle-orm';

export const createMatchPost = async (input: CreateMatchPostInput): Promise<MatchPost> => {
  try {
    // Validate that the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert match post record
    const result = await db.insert(matchPostsTable)
      .values({
        user_id: input.user_id,
        team_name: input.team_name,
        skill_level: input.skill_level,
        match_date: input.match_date,
        location: input.location,
        field_name: input.field_name,
        contact_info: input.contact_info,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Match post creation failed:', error);
    throw error;
  }
};
