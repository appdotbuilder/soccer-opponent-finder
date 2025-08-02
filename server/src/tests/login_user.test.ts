
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
  phone: '555-1234'
};

const testLoginInput: LoginUserInput = {
  email: testUser.email,
  password: testUser.password
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create test user with hashed password using Bun
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable).values({
      email: testUser.email,
      password_hash: hashedPassword,
      name: testUser.name,
      phone: testUser.phone
    }).execute();

    const result = await loginUser(testLoginInput);

    // Verify user data
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.name).toEqual(testUser.name);
    expect(result.user.phone).toEqual(testUser.phone);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.password_hash).toEqual(hashedPassword);

    // Verify token is valid
    expect(result.token).toBeDefined();
    const decoded = JSON.parse(atob(result.token));
    expect(decoded.userId).toEqual(result.user.id);
    expect(decoded.email).toEqual(testUser.email);
    expect(decoded.exp).toBeGreaterThan(Date.now());
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidInput))
      .rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable).values({
      email: testUser.email,
      password_hash: hashedPassword,
      name: testUser.name,
      phone: testUser.phone
    }).execute();

    const invalidInput: LoginUserInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput))
      .rejects.toThrow(/invalid email or password/i);
  });

  it('should handle user with null phone', async () => {
    // Create user without phone
    const hashedPassword = await Bun.password.hash(testUser.password);
    await db.insert(usersTable).values({
      email: testUser.email,
      password_hash: hashedPassword,
      name: testUser.name,
      phone: null
    }).execute();

    const result = await loginUser(testLoginInput);

    expect(result.user.phone).toBeNull();
    expect(result.token).toBeDefined();
  });
});
