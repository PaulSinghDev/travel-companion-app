
import { db } from '../db';
import { postsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePost = async (id: string): Promise<void> => {
  try {
    await db.delete(postsTable)
      .where(eq(postsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Post deletion failed:', error);
    throw error;
  }
};
