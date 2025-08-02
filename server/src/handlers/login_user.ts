
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';

export const loginUser = async (input: LoginUserInput): Promise<AuthResponse> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password using Bun's built-in password verification
    const isPasswordValid = await Bun.password.verify(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate simple token (in production, use proper JWT library)
    const tokenData = {
      userId: user.id,
      email: user.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    const token = btoa(JSON.stringify(tokenData));

    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        name: user.name,
        phone: user.phone,
        created_at: user.created_at
      },
      token
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
