
import { db } from '../db';
import { travelPlansTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTravelPlan = async (id: string): Promise<void> => {
  try {
    await db.delete(travelPlansTable)
      .where(eq(travelPlansTable.id, id))
      .execute();
  } catch (error) {
    console.error('Travel plan deletion failed:', error);
    throw error;
  }
};
