
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUser } from '../handlers/get_user';

const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  bio: 'A test user bio',
  location: 'Test City',
  interests: ['travel', 'photography'],
  is_discoverable: true
};

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when found', async () => {
    // Create test user
    const createdUsers = await db.insert(usersTable)
      .values({
        id: 'test-user-id',
        email: testUser.email,
        name: testUser.name,
        bio: testUser.bio,
        location: testUser.location,
        interests: testUser.interests || [],
        is_discoverable: testUser.is_discoverable || false
      })
      .returning()
      .execute();

    const createdUser = createdUsers[0];

    // Get user by id
    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(createdUser.id);
    expect(result?.email).toEqual('test@example.com');
    expect(result?.name).toEqual('Test User');
    expect(result?.bio).toEqual('A test user bio');
    expect(result?.location).toEqual('Test City');
    expect(result?.interests).toEqual(['travel', 'photography']);
    expect(result?.is_discoverable).toEqual(true);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user not found', async () => {
    const result = await getUser('non-existent-id');

    expect(result).toBeNull();
  });

  it('should handle user with empty interests array', async () => {
    // Create test user with empty interests
    const createdUsers = await db.insert(usersTable)
      .values({
        id: 'test-user-empty-interests',
        email: 'empty@example.com',
        name: 'Empty User',
        interests: []
      })
      .returning()
      .execute();

    const createdUser = createdUsers[0];

    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result?.interests).toEqual([]);
  });

  it('should handle user with minimal required fields', async () => {
    // Create user with only required fields
    const createdUsers = await db.insert(usersTable)
      .values({
        id: 'minimal-user-id',
        email: 'minimal@example.com'
      })
      .returning()
      .execute();

    const createdUser = createdUsers[0];

    const result = await getUser(createdUser.id);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual('minimal-user-id');
    expect(result?.email).toEqual('minimal@example.com');
    expect(result?.name).toBeNull();
    expect(result?.bio).toBeNull();
    expect(result?.location).toBeNull();
    expect(result?.interests).toEqual([]);
    expect(result?.is_discoverable).toEqual(false);
  });
});
