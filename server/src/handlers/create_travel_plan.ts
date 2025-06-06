
import { db } from '../db';
import { travelPlansTable } from '../db/schema';
import { type CreateTravelPlanInput, type TravelPlan } from '../schema';
import { randomUUID } from 'crypto';

export const createTravelPlan = async (input: CreateTravelPlanInput): Promise<TravelPlan> => {
  try {
    // Insert travel plan record
    const result = await db.insert(travelPlansTable)
      .values({
        id: randomUUID(),
        user_id: input.user_id,
        mode: input.mode,
        departure_time: input.departure_time,
        arrival_time: input.arrival_time,
        departure_location: input.departure_location,
        arrival_location: input.arrival_location,
        booking_reference: input.booking_reference,
        duration_minutes: input.duration_minutes,
        travel_provider: input.travel_provider,
        additional_info: input.additional_info
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Travel plan creation failed:', error);
    throw error;
  }
};
