
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, matchPostsTable } from '../db/schema';
import { getMatchPostById } from '../handlers/get_match_post_by_id';

describe('getMatchPostById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return match post when it exists', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: '+1234567890'
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
        match_date: new Date('2024-06-15T10:00:00Z'),
        location: 'Central Park',
        field_name: 'Field A',
        contact_info: 'test@example.com',
        description: 'Looking for a friendly match',
        is_active: true
      })
      .returning()
      .execute();

    const matchPostId = matchPostResult[0].id;

    // Test the handler
    const result = await getMatchPostById(matchPostId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(matchPostId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.team_name).toEqual('Test Team');
    expect(result!.skill_level).toEqual('Intermediate');
    expect(result!.match_date).toBeInstanceOf(Date);
    expect(result!.location).toEqual('Central Park');
    expect(result!.field_name).toEqual('Field A');
    expect(result!.contact_info).toEqual('test@example.com');
    expect(result!.description).toEqual('Looking for a friendly match');
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when match post does not exist', async () => {
    const result = await getMatchPostById(999);
    expect(result).toBeNull();
  });

  it('should return match post with nullable fields set to null', async () => {
    // Create prerequisite user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User 2',
        phone: null // Test nullable field
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create match post with nullable fields set to null
    const matchPostResult = await db.insert(matchPostsTable)
      .values({
        user_id: userId,
        team_name: 'Minimal Team',
        skill_level: 'Beginner',
        match_date: new Date('2024-07-01T14:00:00Z'),
        location: 'Sports Complex',
        field_name: null, // Nullable field
        contact_info: 'minimal@example.com',
        description: null, // Nullable field
        is_active: false
      })
      .returning()
      .execute();

    const matchPostId = matchPostResult[0].id;

    // Test the handler
    const result = await getMatchPostById(matchPostId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(matchPostId);
    expect(result!.team_name).toEqual('Minimal Team');
    expect(result!.skill_level).toEqual('Beginner');
    expect(result!.field_name).toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.is_active).toEqual(false);
  });
});
