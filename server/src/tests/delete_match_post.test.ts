
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, matchPostsTable } from '../db/schema';
import { deleteMatchPost } from '../handlers/delete_match_post';
import { eq } from 'drizzle-orm';

describe('deleteMatchPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing match post', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test match post
    const matchPostResult = await db.insert(matchPostsTable)
      .values({
        user_id: userId,
        team_name: 'Test Team',
        skill_level: 'Intermediate',
        match_date: new Date('2024-06-15T18:00:00Z'),
        location: 'Test Location',
        field_name: 'Test Field',
        contact_info: 'test@example.com',
        description: 'Test description'
      })
      .returning()
      .execute();

    const matchPostId = matchPostResult[0].id;

    // Delete the match post
    const result = await deleteMatchPost(matchPostId);

    // Verify deletion success
    expect(result.success).toBe(true);

    // Verify post was actually deleted from database
    const remainingPosts = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, matchPostId))
      .execute();

    expect(remainingPosts).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent match post', async () => {
    const nonExistentId = 99999;

    const result = await deleteMatchPost(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should not affect other match posts when deleting one', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create two test match posts
    const matchPost1Result = await db.insert(matchPostsTable)
      .values({
        user_id: userId,
        team_name: 'Team One',
        skill_level: 'Beginner',
        match_date: new Date('2024-06-15T18:00:00Z'),
        location: 'Location One',
        field_name: 'Field One',
        contact_info: 'test1@example.com',
        description: 'First post'
      })
      .returning()
      .execute();

    const matchPost2Result = await db.insert(matchPostsTable)
      .values({
        user_id: userId,
        team_name: 'Team Two',
        skill_level: 'Advanced',
        match_date: new Date('2024-06-16T19:00:00Z'),
        location: 'Location Two',
        field_name: 'Field Two',
        contact_info: 'test2@example.com',
        description: 'Second post'
      })
      .returning()
      .execute();

    const matchPost1Id = matchPost1Result[0].id;
    const matchPost2Id = matchPost2Result[0].id;

    // Delete only the first match post
    const result = await deleteMatchPost(matchPost1Id);

    expect(result.success).toBe(true);

    // Verify first post is deleted
    const deletedPost = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, matchPost1Id))
      .execute();

    expect(deletedPost).toHaveLength(0);

    // Verify second post still exists
    const remainingPost = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, matchPost2Id))
      .execute();

    expect(remainingPost).toHaveLength(1);
    expect(remainingPost[0].team_name).toEqual('Team Two');
  });
});
