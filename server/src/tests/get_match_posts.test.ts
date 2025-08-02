
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, matchPostsTable } from '../db/schema';
import { type MatchPostFilters } from '../schema';
import { getMatchPosts } from '../handlers/get_match_posts';

describe('getMatchPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all match posts when no filters provided', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test match posts
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: userId,
          team_name: 'Team A',
          skill_level: 'Beginner',
          match_date: new Date('2024-01-15'),
          location: 'Park A',
          field_name: 'Field 1',
          contact_info: 'contact@teama.com',
          description: 'Looking for a friendly match',
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Team B',
          skill_level: 'Advanced',
          match_date: new Date('2024-01-20'),
          location: 'Park B',
          field_name: null,
          contact_info: 'contact@teamb.com',
          description: null,
          is_active: false
        }
      ])
      .execute();

    const results = await getMatchPosts();

    expect(results).toHaveLength(2);
    expect(results[0].team_name).toEqual('Team A');
    expect(results[1].team_name).toEqual('Team B');
  });

  it('should filter by skill level', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create match posts with different skill levels
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: userId,
          team_name: 'Beginner Team',
          skill_level: 'Beginner',
          match_date: new Date('2024-01-15'),
          location: 'Park A',
          field_name: null,
          contact_info: 'beginner@team.com',
          description: null,
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Advanced Team',
          skill_level: 'Advanced',
          match_date: new Date('2024-01-20'),
          location: 'Park B',
          field_name: null,
          contact_info: 'advanced@team.com',
          description: null,
          is_active: true
        }
      ])
      .execute();

    const filters: MatchPostFilters = {
      skill_level: 'Beginner'
    };

    const results = await getMatchPosts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].team_name).toEqual('Beginner Team');
    expect(results[0].skill_level).toEqual('Beginner');
  });

  it('should filter by location', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create match posts with different locations
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: userId,
          team_name: 'Team Downtown',
          skill_level: 'Intermediate',
          match_date: new Date('2024-01-15'),
          location: 'Downtown Park',
          field_name: null,
          contact_info: 'downtown@team.com',
          description: null,
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Team Uptown',
          skill_level: 'Intermediate',
          match_date: new Date('2024-01-20'),
          location: 'Uptown Field',
          field_name: null,
          contact_info: 'uptown@team.com',
          description: null,
          is_active: true
        }
      ])
      .execute();

    const filters: MatchPostFilters = {
      location: 'Downtown Park'
    };

    const results = await getMatchPosts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].team_name).toEqual('Team Downtown');
    expect(results[0].location).toEqual('Downtown Park');
  });

  it('should filter by date range', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create match posts with different dates
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: userId,
          team_name: 'Early Team',
          skill_level: 'Beginner',
          match_date: new Date('2024-01-05'),
          location: 'Park A',
          field_name: null,
          contact_info: 'early@team.com',
          description: null,
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Mid Team',
          skill_level: 'Intermediate',
          match_date: new Date('2024-01-15'),
          location: 'Park B',
          field_name: null,
          contact_info: 'mid@team.com',
          description: null,
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Late Team',
          skill_level: 'Advanced',
          match_date: new Date('2024-01-25'),
          location: 'Park C',
          field_name: null,
          contact_info: 'late@team.com',
          description: null,
          is_active: true
        }
      ])
      .execute();

    const filters: MatchPostFilters = {
      date_from: new Date('2024-01-10'),
      date_to: new Date('2024-01-20')
    };

    const results = await getMatchPosts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].team_name).toEqual('Mid Team');
    expect(results[0].match_date).toBeInstanceOf(Date);
    expect(results[0].match_date >= new Date('2024-01-10')).toBe(true);
    expect(results[0].match_date <= new Date('2024-01-20')).toBe(true);
  });

  it('should filter by active status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create match posts with different active statuses
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: userId,
          team_name: 'Active Team',
          skill_level: 'Beginner',
          match_date: new Date('2024-01-15'),
          location: 'Park A',
          field_name: null,
          contact_info: 'active@team.com',
          description: null,
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Inactive Team',
          skill_level: 'Intermediate',
          match_date: new Date('2024-01-20'),
          location: 'Park B',
          field_name: null,
          contact_info: 'inactive@team.com',
          description: null,
          is_active: false
        }
      ])
      .execute();

    const filters: MatchPostFilters = {
      is_active: true
    };

    const results = await getMatchPosts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].team_name).toEqual('Active Team');
    expect(results[0].is_active).toBe(true);
  });

  it('should apply multiple filters together', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User',
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create various match posts
    await db.insert(matchPostsTable)
      .values([
        {
          user_id: userId,
          team_name: 'Perfect Match',
          skill_level: 'Intermediate',
          match_date: new Date('2024-01-15'),
          location: 'Central Park',
          field_name: null,
          contact_info: 'perfect@team.com',
          description: null,
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Wrong Skill',
          skill_level: 'Beginner',
          match_date: new Date('2024-01-15'),
          location: 'Central Park',
          field_name: null,
          contact_info: 'wrong@team.com',
          description: null,
          is_active: true
        },
        {
          user_id: userId,
          team_name: 'Wrong Location',
          skill_level: 'Intermediate',
          match_date: new Date('2024-01-15'),
          location: 'Other Park',
          field_name: null,
          contact_info: 'wrong2@team.com',
          description: null,
          is_active: true
        }
      ])
      .execute();

    const filters: MatchPostFilters = {
      skill_level: 'Intermediate',
      location: 'Central Park',
      is_active: true
    };

    const results = await getMatchPosts(filters);

    expect(results).toHaveLength(1);
    expect(results[0].team_name).toEqual('Perfect Match');
    expect(results[0].skill_level).toEqual('Intermediate');
    expect(results[0].location).toEqual('Central Park');
    expect(results[0].is_active).toBe(true);
  });
});
