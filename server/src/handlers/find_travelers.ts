
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type FindTravelersInput, type User } from '../schema';
import { eq, and, ne, sql, type SQL } from 'drizzle-orm';

export const findTravelers = async (input: FindTravelersInput): Promise<User[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Exclude the requesting user
    conditions.push(ne(usersTable.id, input.user_id));

    // Only include discoverable users
    conditions.push(eq(usersTable.is_discoverable, true));

    // Filter by location if provided
    if (input.location) {
      conditions.push(eq(usersTable.location, input.location));
    }

    // Filter by interests if provided
    if (input.interests && input.interests.length > 0) {
      // Use the ?| operator to check if any of the interests exist in the JSON array
      const interestsCondition = sql`${usersTable.interests}::jsonb ?| array[${sql.join(
        input.interests.map(interest => sql`${interest}`), 
        sql`, `
      )}]`;
      conditions.push(interestsCondition);
    }

    // Build the base query with conditions
    const baseQuery = db.select()
      .from(usersTable)
      .where(and(...conditions));

    // Execute query with or without limit
    const results = input.limit 
      ? await baseQuery.limit(input.limit).execute()
      : await baseQuery.execute();

    return results;
  } catch (error) {
    console.error('Find travelers failed:', error);
    throw error;
  }
};
