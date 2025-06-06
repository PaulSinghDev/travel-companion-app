
import { db } from '../db';
import { travelDocumentsTable } from '../db/schema';
import { type GetUserDocumentsInput, type TravelDocument } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserDocuments = async (input: GetUserDocumentsInput): Promise<TravelDocument[]> => {
  try {
    const results = await db.select()
      .from(travelDocumentsTable)
      .where(eq(travelDocumentsTable.user_id, input.user_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get user documents failed:', error);
    throw error;
  }
};
