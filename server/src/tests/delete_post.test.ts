
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { deletePost } from '../handlers/delete_post';
import { eq } from 'drizzle-orm';

describe('deletePost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a post', async () => {
    // Create a test user first
    const testUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      bio: null,
      location: null,
      interests: [],
      is_discoverable: false
    };

    await db.insert(usersTable).values(testUser).execute();

    // Create a test post
    const testPost = {
      id: 'post-1',
      user_id: 'user-1',
      content: 'Test post content',
      image_urls: ['https://example.com/image.jpg'],
      location: 'Test Location'
    };

    await db.insert(postsTable).values(testPost).execute();

    // Verify post exists before deletion
    const postsBefore = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post-1'))
      .execute();

    expect(postsBefore).toHaveLength(1);

    // Delete the post
    await deletePost('post-1');

    // Verify post is deleted
    const postsAfter = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post-1'))
      .execute();

    expect(postsAfter).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent post', async () => {
    // Attempting to delete a non-existent post should not throw an error
    await expect(deletePost('non-existent-id')).resolves.toBeUndefined();

    // Verify no posts exist
    const allPosts = await db.select().from(postsTable).execute();
    expect(allPosts).toHaveLength(0);
  });

  it('should only delete the specified post', async () => {
    // Create a test user
    const testUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      bio: null,
      location: null,
      interests: [],
      is_discoverable: false
    };

    await db.insert(usersTable).values(testUser).execute();

    // Create multiple test posts
    const testPosts = [
      {
        id: 'post-1',
        user_id: 'user-1',
        content: 'First post',
        image_urls: [],
        location: null
      },
      {
        id: 'post-2',
        user_id: 'user-1',
        content: 'Second post',
        image_urls: [],
        location: null
      }
    ];

    await db.insert(postsTable).values(testPosts).execute();

    // Delete only the first post
    await deletePost('post-1');

    // Verify only post-1 is deleted
    const remainingPosts = await db.select()
      .from(postsTable)
      .execute();

    expect(remainingPosts).toHaveLength(1);
    expect(remainingPosts[0].id).toEqual('post-2');
    expect(remainingPosts[0].content).toEqual('Second post');
  });
});
