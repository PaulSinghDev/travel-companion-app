
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  bio: 'I love traveling!',
  location: 'New York',
  interests: ['photography', 'hiking'],
  is_discoverable: true
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Validate all fields
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.image).toEqual('https://example.com/avatar.jpg');
    expect(result.bio).toEqual('I love traveling!');
    expect(result.location).toEqual('New York');
    expect(result.interests).toEqual(['photography', 'hiking']);
    expect(result.is_discoverable).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with minimal required fields', async () => {
    const minimalInput: CreateUserInput = {
      email: 'minimal@example.com'
    };

    const result = await createUser(minimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.name).toBeNull();
    expect(result.image).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.location).toBeNull();
    expect(result.interests).toEqual([]);
    expect(result.is_discoverable).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify persistence
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].interests).toEqual(['photography', 'hiking']);
    expect(users[0].is_discoverable).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    const inputWithNulls: CreateUserInput = {
      email: 'nulls@example.com',
      name: null,
      bio: null,
      location: null
    };

    const result = await createUser(inputWithNulls);

    expect(result.email).toEqual('nulls@example.com');
    expect(result.name).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.location).toBeNull();
    expect(result.image).toBeNull(); // Should default to null
    expect(result.interests).toEqual([]); // Should default to empty array
    expect(result.is_discoverable).toEqual(false); // Should default to false
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create second user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      name: 'Different User'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
