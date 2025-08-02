
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, matchPostsTable } from '../db/schema';
import { getUserMatchPosts } from '../handlers/get_user_match_posts';

describe('getUserMatchPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return match posts for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create match posts for the user
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: userId,
          team_name: 'Team Alpha',
          skill_level: 'Advanced',
          match_date: new Date('2024-01-15'),
          location: 'Soccer Field A',
          field_name: 'Field 1',
          contact_info: 'alpha@example.com',
          description: 'Looking for a competitive match',
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Team Beta',
          skill_level: 'Intermediate',
          match_date: new Date('2024-01-20'),
          location: 'Soccer Field B',
          field_name: null,
          contact_info: 'beta@example.com',
          description: null,
          is_active: false
        }
      ])
      .execute();

    const result = await getUserMatchPosts(userId);

    expect(result).toHaveLength(2);
    expect(result[0].team_name).toEqual('Team Alpha');
    expect(result[0].skill_level).toEqual('Advanced');
    expect(result[0].user_id).toEqual(userId);
    expect(result[1].team_name).toEqual('Team Beta');
    expect(result[1].skill_level).toEqual('Intermediate');
    expect(result[1].user_id).toEqual(userId);
  });

  it('should return empty array when user has no match posts', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getUserMatchPosts(userId);

    expect(result).toHaveLength(0);
  });

  it('should only return match posts for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        name: 'User 1',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        name: 'User 2',
        phone: '098-765-4321'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create match posts for both users
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: user1Id,
          team_name: 'User 1 Team',
          skill_level: 'Advanced',
          match_date: new Date('2024-01-15'),
          location: 'Soccer Field A',
          field_name: 'Field 1',
          contact_info: 'user1@example.com',
          description: 'User 1 match',
          is_active: true
        },
        {
          user_id: user2Id,
          team_name: 'User 2 Team',
          skill_level: 'Beginner',
          match_date: new Date('2024-01-20'),
          location: 'Soccer Field B',
          field_name: 'Field 2',
          contact_info: 'user2@example.com',
          description: 'User 2 match',
          is_active: true
        }
      ])
      .execute();

    const user1Posts = await getUserMatchPosts(user1Id);
    const user2Posts = await getUserMatchPosts(user2Id);

    expect(user1Posts).toHaveLength(1);
    expect(user1Posts[0].team_name).toEqual('User 1 Team');
    expect(user1Posts[0].user_id).toEqual(user1Id);

    expect(user2Posts).toHaveLength(1);
    expect(user2Posts[0].team_name).toEqual('User 2 Team');
    expect(user2Posts[0].user_id).toEqual(user2Id);
  });
});
