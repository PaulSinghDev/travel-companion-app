
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, travelPlansTable } from '../db/schema';
import { type UpdateTravelPlanInput, type CreateUserInput, type CreateTravelPlanInput } from '../schema';
import { updateTravelPlan } from '../handlers/update_travel_plan';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  email: 'traveler@example.com',
  name: 'Test Traveler',
  is_discoverable: true
};

// Test travel plan data
const testTravelPlan: CreateTravelPlanInput = {
  user_id: 'user-123',
  mode: 'flight',
  departure_time: new Date('2024-06-15T10:00:00Z'),
  arrival_time: new Date('2024-06-15T14:00:00Z'),
  departure_location: 'New York',
  arrival_location: 'London',
  booking_reference: 'ABC123',
  duration_minutes: 480,
  travel_provider: 'Test Airlines',
  additional_info: 'Window seat requested'
};

describe('updateTravelPlan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a travel plan with all fields', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        id: 'user-123',
        email: testUser.email,
        name: testUser.name,
        is_discoverable: testUser.is_discoverable
      })
      .execute();

    // Create travel plan
    await db.insert(travelPlansTable)
      .values({
        id: 'plan-123',
        ...testTravelPlan
      })
      .execute();

    const updateInput: UpdateTravelPlanInput = {
      id: 'plan-123',
      mode: 'train',
      departure_time: new Date('2024-06-16T12:00:00Z'),
      arrival_time: new Date('2024-06-16T18:00:00Z'),
      departure_location: 'Paris',
      arrival_location: 'Berlin',
      booking_reference: 'XYZ789',
      duration_minutes: 360,
      travel_provider: 'Euro Rail',
      additional_info: 'First class ticket'
    };

    const result = await updateTravelPlan(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual('plan-123');
    expect(result.user_id).toEqual('user-123');
    expect(result.mode).toEqual('train');
    expect(result.departure_time).toEqual(new Date('2024-06-16T12:00:00Z'));
    expect(result.arrival_time).toEqual(new Date('2024-06-16T18:00:00Z'));
    expect(result.departure_location).toEqual('Paris');
    expect(result.arrival_location).toEqual('Berlin');
    expect(result.booking_reference).toEqual('XYZ789');
    expect(result.duration_minutes).toEqual(360);
    expect(result.travel_provider).toEqual('Euro Rail');
    expect(result.additional_info).toEqual('First class ticket');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        id: 'user-456',
        email: 'partial@example.com',
        name: 'Partial Update User',
        is_discoverable: false
      })
      .execute();

    // Create travel plan
    await db.insert(travelPlansTable)
      .values({
        id: 'plan-456',
        user_id: 'user-456',
        mode: 'bus',
        departure_time: new Date('2024-07-01T08:00:00Z'),
        arrival_time: new Date('2024-07-01T16:00:00Z'),
        departure_location: 'Madrid',
        arrival_location: 'Barcelona',
        booking_reference: 'BUS001',
        duration_minutes: 480,
        travel_provider: 'Spanish Bus Co',
        additional_info: 'Economy seat'
      })
      .execute();

    const partialUpdateInput: UpdateTravelPlanInput = {
      id: 'plan-456',
      mode: 'train',
      booking_reference: 'TRAIN001'
    };

    const result = await updateTravelPlan(partialUpdateInput);

    // Verify only specified fields were updated
    expect(result.mode).toEqual('train');
    expect(result.booking_reference).toEqual('TRAIN001');
    
    // Verify other fields remained unchanged
    expect(result.departure_location).toEqual('Madrid');
    expect(result.arrival_location).toEqual('Barcelona');
    expect(result.duration_minutes).toEqual(480);
    expect(result.travel_provider).toEqual('Spanish Bus Co');
    expect(result.additional_info).toEqual('Economy seat');
  });

  it('should update nullable fields to null', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        id: 'user-789',
        email: 'nullable@example.com',
        name: 'Nullable Test User',
        is_discoverable: true
      })
      .execute();

    // Create travel plan with non-null values
    await db.insert(travelPlansTable)
      .values({
        id: 'plan-789',
        user_id: 'user-789',
        mode: 'flight',
        departure_time: new Date('2024-08-01T10:00:00Z'),
        arrival_time: new Date('2024-08-01T14:00:00Z'),
        departure_location: 'Tokyo',
        arrival_location: 'Osaka',
        booking_reference: 'FLIGHT123',
        duration_minutes: 240,
        travel_provider: 'Japan Air',
        additional_info: 'Business class'
      })
      .execute();

    const nullUpdateInput: UpdateTravelPlanInput = {
      id: 'plan-789',
      booking_reference: null,
      duration_minutes: null,
      travel_provider: null,
      additional_info: null
    };

    const result = await updateTravelPlan(nullUpdateInput);

    // Verify nullable fields were set to null
    expect(result.booking_reference).toBeNull();
    expect(result.duration_minutes).toBeNull();
    expect(result.travel_provider).toBeNull();
    expect(result.additional_info).toBeNull();
    
    // Verify required fields remained unchanged
    expect(result.mode).toEqual('flight');
    expect(result.departure_location).toEqual('Tokyo');
    expect(result.arrival_location).toEqual('Osaka');
  });

  it('should save updated travel plan to database', async () => {
    // Create prerequisite user
    await db.insert(usersTable)
      .values({
        id: 'user-db',
        email: 'db@example.com',
        name: 'DB Test User',
        is_discoverable: false
      })
      .execute();

    // Create travel plan
    await db.insert(travelPlansTable)
      .values({
        id: 'plan-db',
        user_id: 'user-db',
        mode: 'taxi',
        departure_time: new Date('2024-09-01T15:00:00Z'),
        arrival_time: new Date('2024-09-01T16:00:00Z'),
        departure_location: 'Airport',
        arrival_location: 'Hotel'
      })
      .execute();

    const updateInput: UpdateTravelPlanInput = {
      id: 'plan-db',
      mode: 'boat',
      departure_location: 'Harbor',
      arrival_location: 'Island'
    };

    await updateTravelPlan(updateInput);

    // Query database to verify changes were persisted
    const plans = await db.select()
      .from(travelPlansTable)
      .where(eq(travelPlansTable.id, 'plan-db'))
      .execute();

    expect(plans).toHaveLength(1);
    expect(plans[0].mode).toEqual('boat');
    expect(plans[0].departure_location).toEqual('Harbor');
    expect(plans[0].arrival_location).toEqual('Island');
    expect(plans[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent travel plan', async () => {
    const updateInput: UpdateTravelPlanInput = {
      id: 'non-existent-plan',
      mode: 'flight'
    };

    await expect(updateTravelPlan(updateInput)).rejects.toThrow(/not found/i);
  });
});
