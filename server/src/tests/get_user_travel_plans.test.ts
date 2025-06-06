
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, travelPlansTable } from '../db/schema';
import { type GetUserTravelPlansInput } from '../schema';
import { getUserTravelPlans } from '../handlers/get_user_travel_plans';

describe('getUserTravelPlans', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return travel plans for a user', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'test@example.com',
        interests: ['travel', 'photography'],
        is_discoverable: true
      })
      .returning()
      .execute();

    // Create test travel plans
    const travelPlan1 = await db.insert(travelPlansTable)
      .values({
        id: 'plan-1',
        user_id: 'user-1',
        mode: 'flight',
        departure_time: new Date('2024-01-15T10:00:00Z'),
        arrival_time: new Date('2024-01-15T14:00:00Z'),
        departure_location: 'New York',
        arrival_location: 'London',
        booking_reference: 'ABC123',
        duration_minutes: 240,
        travel_provider: 'Airlines Inc',
        additional_info: 'Window seat preferred'
      })
      .returning()
      .execute();

    const travelPlan2 = await db.insert(travelPlansTable)
      .values({
        id: 'plan-2',
        user_id: 'user-1',
        mode: 'train',
        departure_time: new Date('2024-01-20T08:00:00Z'),
        arrival_time: new Date('2024-01-20T12:00:00Z'),
        departure_location: 'London',
        arrival_location: 'Paris',
        booking_reference: null,
        duration_minutes: null,
        travel_provider: null,
        additional_info: null
      })
      .returning()
      .execute();

    const input: GetUserTravelPlansInput = {
      user_id: 'user-1'
    };

    const result = await getUserTravelPlans(input);

    // Should return both travel plans
    expect(result).toHaveLength(2);
    
    // Results should be ordered by departure_time descending (most recent first)
    expect(result[0].id).toEqual('plan-2');
    expect(result[1].id).toEqual('plan-1');

    // Check first travel plan details
    expect(result[0].user_id).toEqual('user-1');
    expect(result[0].mode).toEqual('train');
    expect(result[0].departure_location).toEqual('London');
    expect(result[0].arrival_location).toEqual('Paris');
    expect(result[0].departure_time).toBeInstanceOf(Date);
    expect(result[0].arrival_time).toBeInstanceOf(Date);
    expect(result[0].booking_reference).toBeNull();
    expect(result[0].duration_minutes).toBeNull();
    expect(result[0].travel_provider).toBeNull();
    expect(result[0].additional_info).toBeNull();

    // Check second travel plan details
    expect(result[1].user_id).toEqual('user-1');
    expect(result[1].mode).toEqual('flight');
    expect(result[1].departure_location).toEqual('New York');
    expect(result[1].arrival_location).toEqual('London');
    expect(result[1].booking_reference).toEqual('ABC123');
    expect(result[1].duration_minutes).toEqual(240);
    expect(result[1].travel_provider).toEqual('Airlines Inc');
    expect(result[1].additional_info).toEqual('Window seat preferred');
  });

  it('should return empty array for user with no travel plans', async () => {
    // Create test user without travel plans
    await db.insert(usersTable)
      .values({
        id: 'user-2',
        email: 'test2@example.com',
        interests: [],
        is_discoverable: false
      })
      .returning()
      .execute();

    const input: GetUserTravelPlansInput = {
      user_id: 'user-2'
    };

    const result = await getUserTravelPlans(input);

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 'user-3',
        email: 'test3@example.com',
        interests: [],
        is_discoverable: false
      })
      .returning()
      .execute();

    // Create multiple travel plans
    for (let i = 1; i <= 5; i++) {
      await db.insert(travelPlansTable)
        .values({
          id: `plan-${i}`,
          user_id: 'user-3',
          mode: 'flight',
          departure_time: new Date(`2024-01-${10 + i}T10:00:00Z`),
          arrival_time: new Date(`2024-01-${10 + i}T14:00:00Z`),
          departure_location: 'City A',
          arrival_location: 'City B'
        })
        .returning()
        .execute();
    }

    const input: GetUserTravelPlansInput = {
      user_id: 'user-3',
      limit: 3
    };

    const result = await getUserTravelPlans(input);

    expect(result).toHaveLength(3);
  });

  it('should respect offset parameter', async () => {
    // Create test user
    await db.insert(usersTable)
      .values({
        id: 'user-4',
        email: 'test4@example.com',
        interests: [],
        is_discoverable: false
      })
      .returning()
      .execute();

    // Create multiple travel plans
    for (let i = 1; i <= 5; i++) {
      await db.insert(travelPlansTable)
        .values({
          id: `plan-${i}`,
          user_id: 'user-4',
          mode: 'flight',
          departure_time: new Date(`2024-01-${10 + i}T10:00:00Z`),
          arrival_time: new Date(`2024-01-${10 + i}T14:00:00Z`),
          departure_location: 'City A',
          arrival_location: 'City B'
        })
        .returning()
        .execute();
    }

    const input: GetUserTravelPlansInput = {
      user_id: 'user-4',
      offset: 2,
      limit: 2
    };

    const result = await getUserTravelPlans(input);

    expect(result).toHaveLength(2);
    // Should get the 3rd and 4th items (by departure_time desc)
    expect(result[0].id).toEqual('plan-3');
    expect(result[1].id).toEqual('plan-2');
  });

  it('should only return travel plans for the specified user', async () => {
    // Create two test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user-5',
          email: 'test5@example.com',
          interests: [],
          is_discoverable: false
        },
        {
          id: 'user-6',
          email: 'test6@example.com',
          interests: [],
          is_discoverable: false
        }
      ])
      .returning()
      .execute();

    // Create travel plans for both users
    await db.insert(travelPlansTable)
      .values([
        {
          id: 'plan-user5',
          user_id: 'user-5',
          mode: 'flight',
          departure_time: new Date('2024-01-15T10:00:00Z'),
          arrival_time: new Date('2024-01-15T14:00:00Z'),
          departure_location: 'City A',
          arrival_location: 'City B'
        },
        {
          id: 'plan-user6',
          user_id: 'user-6',
          mode: 'train',
          departure_time: new Date('2024-01-16T10:00:00Z'),
          arrival_time: new Date('2024-01-16T14:00:00Z'),
          departure_location: 'City C',
          arrival_location: 'City D'
        }
      ])
      .returning()
      .execute();

    const input: GetUserTravelPlansInput = {
      user_id: 'user-5'
    };

    const result = await getUserTravelPlans(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('plan-user5');
    expect(result[0].user_id).toEqual('user-5');
  });
});
