
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '+1234567890'
};

const testInputWithoutPhone: RegisterUserInput = {
  email: 'test2@example.com',
  password: 'password123',
  name: 'Test User 2',
  phone: null
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [salt, hash] = hashedPassword.split(':');
  const testHash = createHash('sha256').update(password + salt).digest('hex');
  return testHash === hash;
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a user with all fields', async () => {
    const result = await registerUser(testInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.phone).toEqual('+1234567890');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should register a user without phone', async () => {
    const result = await registerUser(testInputWithoutPhone);

    expect(result.email).toEqual('test2@example.com');
    expect(result.name).toEqual('Test User 2');
    expect(result.phone).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
  });

  it('should hash the password correctly', async () => {
    const result = await registerUser(testInput);

    // Verify password is hashed correctly
    const isValidHash = verifyPassword('password123', result.password_hash);
    expect(isValidHash).toBe(true);

    // Verify wrong password doesn't match
    const isInvalidHash = verifyPassword('wrongpassword', result.password_hash);
    expect(isInvalidHash).toBe(false);

    // Verify hash contains salt and hash parts
    expect(result.password_hash).toContain(':');
    const parts = result.password_hash.split(':');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveLength(32); // Salt should be 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(64); // SHA256 hash should be 32 bytes = 64 hex chars
  });

  it('should save user to database', async () => {
    const result = await registerUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].phone).toEqual('+1234567890');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for duplicate email', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register another user with same email
    const duplicateInput: RegisterUserInput = {
      email: 'test@example.com',
      password: 'differentpassword',
      name: 'Different User',
      phone: null
    };

    await expect(registerUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should generate unique hashes for same password', async () => {
    const result1 = await registerUser(testInput);
    
    // Register another user with same password but different email
    const secondInput: RegisterUserInput = {
      email: 'different@example.com',
      password: 'password123', // Same password
      name: 'Different User',
      phone: null
    };
    
    const result2 = await registerUser(secondInput);

    // Hashes should be different due to unique salts
    expect(result1.password_hash).not.toEqual(result2.password_hash);
    
    // But both should verify correctly
    expect(verifyPassword('password123', result1.password_hash)).toBe(true);
    expect(verifyPassword('password123', result2.password_hash)).toBe(true);
  });
});
