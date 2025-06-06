
import { db } from '../db';
import { travelPlansTable } from '../db/schema';
import { type UpdateTravelPlanInput, type TravelPlan } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTravelPlan = async (input: UpdateTravelPlanInput): Promise<TravelPlan> => {
  try {
    // Extract id and prepare update data
    const { id, ...updateData } = input;
    
    // Only include fields that are provided (not undefined)
    const fieldsToUpdate: Record<string, any> = {};
    
    if (updateData.mode !== undefined) {
      fieldsToUpdate['mode'] = updateData.mode;
    }
    
    if (updateData.departure_time !== undefined) {
      fieldsToUpdate['departure_time'] = updateData.departure_time;
    }
    
    if (updateData.arrival_time !== undefined) {
      fieldsToUpdate['arrival_time'] = updateData.arrival_time;
    }
    
    if (updateData.departure_location !== undefined) {
      fieldsToUpdate['departure_location'] = updateData.departure_location;
    }
    
    if (updateData.arrival_location !== undefined) {
      fieldsToUpdate['arrival_location'] = updateData.arrival_location;
    }
    
    if (updateData.booking_reference !== undefined) {
      fieldsToUpdate['booking_reference'] = updateData.booking_reference;
    }
    
    if (updateData.duration_minutes !== undefined) {
      fieldsToUpdate['duration_minutes'] = updateData.duration_minutes;
    }
    
    if (updateData.travel_provider !== undefined) {
      fieldsToUpdate['travel_provider'] = updateData.travel_provider;
    }
    
    if (updateData.additional_info !== undefined) {
      fieldsToUpdate['additional_info'] = updateData.additional_info;
    }
    
    // Always update the updated_at timestamp
    fieldsToUpdate['updated_at'] = new Date();

    // Update the travel plan
    const result = await db.update(travelPlansTable)
      .set(fieldsToUpdate)
      .where(eq(travelPlansTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Travel plan with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Travel plan update failed:', error);
    throw error;
  }
};
