
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { createPost } from '../handlers/create_post';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Test user to satisfy foreign key constraint
const testUser = {
  id: nanoid(),
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  bio: null,
  location: null,
  interests: ['travel', 'photography'],
  is_discoverable: true
};

// Simple test input
const testInput: CreatePostInput = {
  user_id: testUser.id,
  content: 'Just arrived in Paris! Amazing city.',
  image_urls: ['https://example.com/paris1.jpg', 'https://example.com/paris2.jpg'],
  location: 'Paris, France'
};

describe('createPost', () => {
  beforeEach(async () => {
    await createDB();
    // Create test user first to satisfy foreign key constraint
    await db.insert(usersTable).values(testUser).execute();
  });
  afterEach(resetDB);

  it('should create a post with all fields', async () => {
    const result = await createPost(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUser.id);
    expect(result.content).toEqual('Just arrived in Paris! Amazing city.');
    expect(result.image_urls).toEqual(['https://example.com/paris1.jpg', 'https://example.com/paris2.jpg']);
    expect(result.location).toEqual('Paris, France');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a post with minimal fields', async () => {
    const minimalInput: CreatePostInput = {
      user_id: testUser.id,
      content: 'Simple post without images or location'
    };

    const result = await createPost(minimalInput);

    expect(result.user_id).toEqual(testUser.id);
    expect(result.content).toEqual('Simple post without images or location');
    expect(result.image_urls).toEqual([]);
    expect(result.location).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save post to database', async () => {
    const result = await createPost(testInput);

    // Query using proper drizzle syntax
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].user_id).toEqual(testUser.id);
    expect(posts[0].content).toEqual(testInput.content);
    expect(posts[0].image_urls).toEqual(testInput.image_urls || []);
    expect(posts[0].location).toEqual(testInput.location || null);
    expect(posts[0].created_at).toBeInstanceOf(Date);
    expect(posts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should fail with non-existent user_id', async () => {
    const invalidInput: CreatePostInput = {
      user_id: 'non-existent-user',
      content: 'This should fail'
    };

    await expect(createPost(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
