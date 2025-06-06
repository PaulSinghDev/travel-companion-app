
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput, type Post } from '../schema';
import { nanoid } from 'nanoid';

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  try {
    // Insert post record
    const result = await db.insert(postsTable)
      .values({
        id: nanoid(),
        user_id: input.user_id,
        content: input.content,
        image_urls: input.image_urls || [],
        location: input.location || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Post creation failed:', error);
    throw error;
  }
};
