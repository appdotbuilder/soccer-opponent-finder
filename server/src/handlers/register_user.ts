
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
};

export const registerUser = async (input: RegisterUserInput): Promise<User> => {
  try {
    // Check if user with this email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password
    const password_hash = hashPassword(input.password);

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        name: input.name,
        phone: input.phone
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
