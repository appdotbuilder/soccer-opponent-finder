
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, matchPostsTable } from '../db/schema';
import { type UpdateMatchPostInput } from '../schema';
import { updateMatchPost } from '../handlers/update_match_post';
import { eq } from 'drizzle-orm';

describe('updateMatchPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testMatchPostId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: '123-456-7890'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test match post
    const matchPostResult = await db.insert(matchPostsTable)
      .values({
        user_id: testUserId,
        team_name: 'Original Team',
        skill_level: 'Beginner',
        match_date: new Date('2024-12-25'),
        location: 'Original Location',
        field_name: 'Original Field',
        contact_info: 'original@contact.com',
        description: 'Original description',
        is_active: true
      })
      .returning()
      .execute();
    testMatchPostId = matchPostResult[0].id;
  });

  it('should update match post with all fields', async () => {
    const updateInput: UpdateMatchPostInput = {
      id: testMatchPostId,
      team_name: 'Updated Team',
      skill_level: 'Advanced',
      match_date: new Date('2024-12-30'),
      location: 'Updated Location',
      field_name: 'Updated Field',
      contact_info: 'updated@contact.com',
      description: 'Updated description',
      is_active: false
    };

    const result = await updateMatchPost(updateInput);

    expect(result.id).toEqual(testMatchPostId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.team_name).toEqual('Updated Team');
    expect(result.skill_level).toEqual('Advanced');
    expect(result.match_date).toEqual(new Date('2024-12-30'));
    expect(result.location).toEqual('Updated Location');
    expect(result.field_name).toEqual('Updated Field');
    expect(result.contact_info).toEqual('updated@contact.com');
    expect(result.description).toEqual('Updated description');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateMatchPostInput = {
      id: testMatchPostId,
      team_name: 'Partially Updated Team',
      skill_level: 'Intermediate'
    };

    const result = await updateMatchPost(updateInput);

    expect(result.team_name).toEqual('Partially Updated Team');
    expect(result.skill_level).toEqual('Intermediate');
    // Other fields should remain unchanged
    expect(result.location).toEqual('Original Location');
    expect(result.field_name).toEqual('Original Field');
    expect(result.contact_info).toEqual('original@contact.com');
    expect(result.description).toEqual('Original description');
    expect(result.is_active).toEqual(true);
  });

  it('should update nullable fields', async () => {
    const updateInput: UpdateMatchPostInput = {
      id: testMatchPostId,
      field_name: null,
      description: null
    };

    const result = await updateMatchPost(updateInput);

    expect(result.field_name).toBeNull();
    expect(result.description).toBeNull();
    // Other fields should remain unchanged
    expect(result.team_name).toEqual('Original Team');
    expect(result.location).toEqual('Original Location');
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalPost = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, testMatchPostId))
      .execute();
    const originalTimestamp = originalPost[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateMatchPostInput = {
      id: testMatchPostId,
      team_name: 'Updated Team'
    };

    const result = await updateMatchPost(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateMatchPostInput = {
      id: testMatchPostId,
      team_name: 'Database Updated Team',
      is_active: false
    };

    await updateMatchPost(updateInput);

    // Verify in database
    const updatedPosts = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, testMatchPostId))
      .execute();

    expect(updatedPosts).toHaveLength(1);
    expect(updatedPosts[0].team_name).toEqual('Database Updated Team');
    expect(updatedPosts[0].is_active).toEqual(false);
  });

  it('should throw error for non-existent match post', async () => {
    const updateInput: UpdateMatchPostInput = {
      id: 99999,
      team_name: 'Updated Team'
    };

    expect(updateMatchPost(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle boolean false values correctly', async () => {
    const updateInput: UpdateMatchPostInput = {
      id: testMatchPostId,
      is_active: false
    };

    const result = await updateMatchPost(updateInput);

    expect(result.is_active).toEqual(false);
  });
});
