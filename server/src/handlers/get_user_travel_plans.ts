
import { db } from '../db';
import { travelPlansTable } from '../db/schema';
import { type GetUserTravelPlansInput, type TravelPlan } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserTravelPlans = async (input: GetUserTravelPlansInput): Promise<TravelPlan[]> => {
  try {
    // Build the complete query in one chain
    const baseQuery = db.select()
      .from(travelPlansTable)
      .where(eq(travelPlansTable.user_id, input.user_id))
      .orderBy(desc(travelPlansTable.departure_time));

    // Apply pagination by chaining methods
    const finalQuery = input.offset !== undefined
      ? (input.limit !== undefined 
          ? baseQuery.limit(input.limit).offset(input.offset)
          : baseQuery.offset(input.offset))
      : (input.limit !== undefined 
          ? baseQuery.limit(input.limit)
          : baseQuery);

    const results = await finalQuery.execute();

    // Return the results as-is since all fields are already in the correct format
    return results;
  } catch (error) {
    console.error('Failed to get user travel plans:', error);
    throw error;
  }
};
