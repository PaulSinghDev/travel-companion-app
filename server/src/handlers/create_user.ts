
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { randomUUID } from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Generate unique ID for the user
    const userId = randomUUID();

    // Insert user record with defaults applied
    const result = await db.insert(usersTable)
      .values({
        id: userId,
        email: input.email,
        name: input.name ?? null,
        image: input.image ?? null,
        bio: input.bio ?? null,
        location: input.location ?? null,
        interests: input.interests ?? [],
        is_discoverable: input.is_discoverable ?? false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
