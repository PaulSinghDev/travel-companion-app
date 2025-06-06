
import { db } from '../db';
import { travelDocumentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTravelDocument = async (id: string): Promise<void> => {
  try {
    await db.delete(travelDocumentsTable)
      .where(eq(travelDocumentsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Travel document deletion failed:', error);
    throw error;
  }
};
