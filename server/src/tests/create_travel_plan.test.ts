
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, travelPlansTable } from '../db/schema';
import { type CreateTravelPlanInput } from '../schema';
import { createTravelPlan } from '../handlers/create_travel_plan';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Create test user first since travel plans require valid user_id
const createTestUser = async () => {
  const userId = randomUUID();
  await db.insert(usersTable)
    .values({
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      interests: [],
      is_discoverable: false
    })
    .execute();
  return userId;
};

// Test input
const testInput: CreateTravelPlanInput = {
  user_id: '', // Will be set in beforeEach
  mode: 'flight',
  departure_time: new Date('2024-06-15T10:00:00Z'),
  arrival_time: new Date('2024-06-15T14:30:00Z'),
  departure_location: 'New York',
  arrival_location: 'London',
  booking_reference: 'ABC123',
  duration_minutes: 450,
  travel_provider: 'Test Airlines',
  additional_info: 'Window seat requested'
};

describe('createTravelPlan', () => {
  beforeEach(async () => {
    await createDB();
    const userId = await createTestUser();
    testInput.user_id = userId;
  });
  
  afterEach(resetDB);

  it('should create a travel plan', async () => {
    const result = await createTravelPlan(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.mode).toEqual('flight');
    expect(result.departure_time).toEqual(testInput.departure_time);
    expect(result.arrival_time).toEqual(testInput.arrival_time);
    expect(result.departure_location).toEqual('New York');
    expect(result.arrival_location).toEqual('London');
    expect(result.booking_reference).toEqual('ABC123');
    expect(result.duration_minutes).toEqual(450);
    expect(result.travel_provider).toEqual('Test Airlines');
    expect(result.additional_info).toEqual('Window seat requested');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save travel plan to database', async () => {
    const result = await createTravelPlan(testInput);

    // Query using proper drizzle syntax
    const travelPlans = await db.select()
      .from(travelPlansTable)
      .where(eq(travelPlansTable.id, result.id))
      .execute();

    expect(travelPlans).toHaveLength(1);
    expect(travelPlans[0].user_id).toEqual(testInput.user_id);
    expect(travelPlans[0].mode).toEqual('flight');
    expect(travelPlans[0].departure_location).toEqual('New York');
    expect(travelPlans[0].arrival_location).toEqual('London');
    expect(travelPlans[0].booking_reference).toEqual('ABC123');
    expect(travelPlans[0].created_at).toBeInstanceOf(Date);
  });

  it('should create travel plan with minimal fields', async () => {
    const minimalInput: CreateTravelPlanInput = {
      user_id: testInput.user_id,
      mode: 'train',
      departure_time: new Date('2024-07-01T08:00:00Z'),
      arrival_time: new Date('2024-07-01T12:00:00Z'),
      departure_location: 'Paris',
      arrival_location: 'Brussels'
    };

    const result = await createTravelPlan(minimalInput);

    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.mode).toEqual('train');
    expect(result.departure_location).toEqual('Paris');
    expect(result.arrival_location).toEqual('Brussels');
    expect(result.booking_reference).toBeNull();
    expect(result.duration_minutes).toBeNull();
    expect(result.travel_provider).toBeNull();
    expect(result.additional_info).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should handle different travel modes correctly', async () => {
    const boatInput: CreateTravelPlanInput = {
      ...testInput,
      mode: 'boat',
      departure_location: 'Dover',
      arrival_location: 'Calais',
      travel_provider: 'Ferry Company'
    };

    const result = await createTravelPlan(boatInput);

    expect(result.mode).toEqual('boat');
    expect(result.departure_location).toEqual('Dover');
    expect(result.arrival_location).toEqual('Calais');
    expect(result.travel_provider).toEqual('Ferry Company');
  });
});
