
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { matchPostsTable, usersTable } from '../db/schema';
import { type CreateMatchPostInput } from '../schema';
import { createMatchPost } from '../handlers/create_match_post';
import { eq } from 'drizzle-orm';

describe('createMatchPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        phone: '+1234567890'
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreateMatchPostInput = {
    user_id: 1, // Will be updated with actual user ID
    team_name: 'Thunder Bolts',
    skill_level: 'Intermediate',
    match_date: new Date('2024-12-25T10:00:00Z'),
    location: 'Central Park',
    field_name: 'Field A',
    contact_info: 'contact@thunderbolts.com',
    description: 'Looking for a friendly match on Christmas morning'
  };

  it('should create a match post', async () => {
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };
    
    const result = await createMatchPost(input);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.team_name).toEqual('Thunder Bolts');
    expect(result.skill_level).toEqual('Intermediate');
    expect(result.match_date).toEqual(new Date('2024-12-25T10:00:00Z'));
    expect(result.location).toEqual('Central Park');
    expect(result.field_name).toEqual('Field A');
    expect(result.contact_info).toEqual('contact@thunderbolts.com');
    expect(result.description).toEqual('Looking for a friendly match on Christmas morning');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save match post to database', async () => {
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };
    
    const result = await createMatchPost(input);

    // Query database to verify persistence
    const matchPosts = await db.select()
      .from(matchPostsTable)
      .where(eq(matchPostsTable.id, result.id))
      .execute();

    expect(matchPosts).toHaveLength(1);
    expect(matchPosts[0].user_id).toEqual(user.id);
    expect(matchPosts[0].team_name).toEqual('Thunder Bolts');
    expect(matchPosts[0].skill_level).toEqual('Intermediate');
    expect(matchPosts[0].location).toEqual('Central Park');
    expect(matchPosts[0].is_active).toBe(true);
    expect(matchPosts[0].created_at).toBeInstanceOf(Date);
    expect(matchPosts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const user = await createTestUser();
    const inputWithNulls = {
      ...testInput,
      user_id: user.id,
      field_name: null,
      description: null
    };
    
    const result = await createMatchPost(inputWithNulls);

    expect(result.field_name).toBeNull();
    expect(result.description).toBeNull();
    expect(result.team_name).toEqual('Thunder Bolts');
    expect(result.is_active).toBe(true);
  });

  it('should throw error when user does not exist', async () => {
    const inputWithInvalidUser = { ...testInput, user_id: 99999 };
    
    await expect(createMatchPost(inputWithInvalidUser))
      .rejects.toThrow(/User with id 99999 does not exist/i);
  });

  it('should set default values correctly', async () => {
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };
    
    const result = await createMatchPost(input);

    // Verify default values are applied
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are recent (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    expect(result.created_at.getTime()).toBeGreaterThan(oneMinuteAgo.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThan(oneMinuteAgo.getTime());
  });
});
