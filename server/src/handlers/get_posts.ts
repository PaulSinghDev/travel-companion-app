
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostsInput, type Post } from '../schema';
import { desc } from 'drizzle-orm';

export const getPosts = async (input?: GetPostsInput): Promise<Post[]> => {
  try {
    // Set defaults for pagination
    const limit = input?.limit ?? 50;
    const offset = input?.offset ?? 0;

    // Build query with pagination and ordering
    const results = await db.select()
      .from(postsTable)
      .orderBy(desc(postsTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get posts:', error);
    throw error;
  }
};
