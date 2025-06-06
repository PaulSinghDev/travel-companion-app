
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<string> => {
  const userId = `user-${Date.now()}`;
  await db.insert(usersTable).values({
    id: userId,
    email: 'test@example.com',
    name: 'Original Name',
    bio: 'Original bio',
    location: 'Original Location',
    interests: ['travel', 'photography'],
    is_discoverable: false
  }).execute();
  return userId;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user name', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Updated Name'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('Updated Name');
    expect(result.bio).toEqual('Original bio'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'New Name',
      bio: 'New bio',
      location: 'New Location',
      interests: ['hiking', 'cooking'],
      is_discoverable: true
    };

    const result = await updateUser(updateInput);

    expect(result.name).toEqual('New Name');
    expect(result.bio).toEqual('New bio');
    expect(result.location).toEqual('New Location');
    expect(result.interests).toEqual(['hiking', 'cooking']);
    expect(result.is_discoverable).toEqual(true);
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
  });

  it('should handle null values', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      name: null,
      bio: null,
      location: null
    };

    const result = await updateUser(updateInput);

    expect(result.name).toBeNull();
    expect(result.bio).toBeNull();
    expect(result.location).toBeNull();
    expect(result.interests).toEqual(['travel', 'photography']); // Should remain unchanged
  });

  it('should update only provided fields', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      bio: 'Only bio updated'
    };

    const result = await updateUser(updateInput);

    expect(result.bio).toEqual('Only bio updated');
    expect(result.name).toEqual('Original Name'); // Should remain unchanged
    expect(result.location).toEqual('Original Location'); // Should remain unchanged
    expect(result.interests).toEqual(['travel', 'photography']); // Should remain unchanged
    expect(result.is_discoverable).toEqual(false); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    const userId = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Persisted Name',
      is_discoverable: true
    };

    await updateUser(updateInput);

    // Verify changes were saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Persisted Name');
    expect(users[0].is_discoverable).toEqual(true);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 'non-existent-user',
      name: 'New Name'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const userId = await createTestUser();
    
    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    
    const originalUpdatedAt = originalUser[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Updated Name'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
