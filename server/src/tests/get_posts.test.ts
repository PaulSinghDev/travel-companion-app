
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { getPosts } from '../handlers/get_posts';

describe('getPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no posts exist', async () => {
    const result = await getPosts();
    expect(result).toEqual([]);
  });

  it('should return posts ordered by created_at descending', async () => {
    // Create a test user first
    const user = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'test@example.com',
        interests: ['travel']
      })
      .returning()
      .execute();

    // Create multiple posts with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    const later = new Date(now.getTime() + 60000); // 1 minute later

    await db.insert(postsTable).values([
      {
        id: 'post-1',
        user_id: user[0].id,
        content: 'First post',
        image_urls: [],
        created_at: earlier,
        updated_at: earlier
      },
      {
        id: 'post-2',
        user_id: user[0].id,
        content: 'Second post',
        image_urls: [],
        created_at: later,
        updated_at: later
      },
      {
        id: 'post-3',
        user_id: user[0].id,
        content: 'Third post',
        image_urls: [],
        created_at: now,
        updated_at: now
      }
    ]).execute();

    const result = await getPosts();

    expect(result).toHaveLength(3);
    // Should be ordered by created_at descending (newest first)
    expect(result[0].content).toBe('Second post');
    expect(result[1].content).toBe('Third post');
    expect(result[2].content).toBe('First post');
  });

  it('should respect limit parameter', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'test@example.com',
        interests: ['travel']
      })
      .returning()
      .execute();

    // Create 5 posts
    const posts = Array.from({ length: 5 }, (_, i) => ({
      id: `post-${i + 1}`,
      user_id: user[0].id,
      content: `Post ${i + 1}`,
      image_urls: [],
      created_at: new Date(Date.now() + i * 1000),
      updated_at: new Date(Date.now() + i * 1000)
    }));

    await db.insert(postsTable).values(posts).execute();

    const result = await getPosts({ limit: 3 });

    expect(result).toHaveLength(3);
  });

  it('should respect offset parameter', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'test@example.com',
        interests: ['travel']
      })
      .returning()
      .execute();

    // Create 5 posts with sequential timestamps
    const posts = Array.from({ length: 5 }, (_, i) => ({
      id: `post-${i + 1}`,
      user_id: user[0].id,
      content: `Post ${i + 1}`,
      image_urls: [],
      created_at: new Date(Date.now() + i * 1000),
      updated_at: new Date(Date.now() + i * 1000)
    }));

    await db.insert(postsTable).values(posts).execute();

    // Get all posts first to verify order
    const allPosts = await getPosts();
    
    // Get posts with offset
    const result = await getPosts({ offset: 2 });

    expect(result).toHaveLength(3);
    // Should skip the first 2 posts (newest ones)
    expect(result[0].id).toBe(allPosts[2].id);
  });

  it('should handle pagination correctly', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'test@example.com',
        interests: ['travel']
      })
      .returning()
      .execute();

    // Create 10 posts
    const posts = Array.from({ length: 10 }, (_, i) => ({
      id: `post-${i + 1}`,
      user_id: user[0].id,
      content: `Post ${i + 1}`,
      image_urls: [],
      created_at: new Date(Date.now() + i * 1000),
      updated_at: new Date(Date.now() + i * 1000)
    }));

    await db.insert(postsTable).values(posts).execute();

    // Test pagination
    const firstPage = await getPosts({ limit: 4, offset: 0 });
    const secondPage = await getPosts({ limit: 4, offset: 4 });

    expect(firstPage).toHaveLength(4);
    expect(secondPage).toHaveLength(4);
    
    // Verify no overlap between pages
    const firstPageIds = firstPage.map(p => p.id);
    const secondPageIds = secondPage.map(p => p.id);
    
    expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
  });

  it('should include all post fields', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'test@example.com',
        interests: ['travel']
      })
      .returning()
      .execute();

    // Create a post with all fields
    await db.insert(postsTable).values({
      id: 'post-1',
      user_id: user[0].id,
      content: 'Test post with location',
      image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      location: 'Paris, France',
      created_at: new Date(),
      updated_at: new Date()
    }).execute();

    const result = await getPosts();

    expect(result).toHaveLength(1);
    const post = result[0];
    
    expect(post.id).toBe('post-1');
    expect(post.user_id).toBe(user[0].id);
    expect(post.content).toBe('Test post with location');
    expect(post.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(post.location).toBe('Paris, France');
    expect(post.created_at).toBeInstanceOf(Date);
    expect(post.updated_at).toBeInstanceOf(Date);
  });
});
