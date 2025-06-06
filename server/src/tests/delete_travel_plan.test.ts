
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, travelPlansTable } from '../db/schema';
import { deleteTravelPlan } from '../handlers/delete_travel_plan';
import { eq } from 'drizzle-orm';

describe('deleteTravelPlan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a travel plan', async () => {
    // Create a test user first
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      interests: [],
      is_discoverable: false
    });

    // Create a test travel plan
    const planId = 'plan-1';
    await db.insert(travelPlansTable).values({
      id: planId,
      user_id: 'user-1',
      mode: 'flight',
      departure_time: new Date('2024-01-01T10:00:00Z'),
      arrival_time: new Date('2024-01-01T14:00:00Z'),
      departure_location: 'New York',
      arrival_location: 'London'
    });

    // Verify travel plan exists
    const beforeDelete = await db.select()
      .from(travelPlansTable)
      .where(eq(travelPlansTable.id, planId))
      .execute();
    expect(beforeDelete).toHaveLength(1);

    // Delete the travel plan
    await deleteTravelPlan(planId);

    // Verify travel plan is deleted
    const afterDelete = await db.select()
      .from(travelPlansTable)
      .where(eq(travelPlansTable.id, planId))
      .execute();
    expect(afterDelete).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent travel plan', async () => {
    // Delete a non-existent travel plan should not throw
    await expect(deleteTravelPlan('non-existent-id')).resolves.toBeUndefined();
  });

  it('should only delete the specified travel plan', async () => {
    // Create a test user first
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'test@example.com',
      interests: [],
      is_discoverable: false
    });

    // Create multiple test travel plans
    await db.insert(travelPlansTable).values([
      {
        id: 'plan-1',
        user_id: 'user-1',
        mode: 'flight',
        departure_time: new Date('2024-01-01T10:00:00Z'),
        arrival_time: new Date('2024-01-01T14:00:00Z'),
        departure_location: 'New York',
        arrival_location: 'London'
      },
      {
        id: 'plan-2',
        user_id: 'user-1',
        mode: 'train',
        departure_time: new Date('2024-01-02T10:00:00Z'),
        arrival_time: new Date('2024-01-02T14:00:00Z'),
        departure_location: 'Paris',
        arrival_location: 'Berlin'
      }
    ]);

    // Delete only one travel plan
    await deleteTravelPlan('plan-1');

    // Verify only the specified plan is deleted
    const remainingPlans = await db.select()
      .from(travelPlansTable)
      .execute();
    
    expect(remainingPlans).toHaveLength(1);
    expect(remainingPlans[0].id).toEqual('plan-2');
    expect(remainingPlans[0].departure_location).toEqual('Paris');
  });

  it('should handle empty string id', async () => {
    // Empty string ID should not throw error
    await expect(deleteTravelPlan('')).resolves.toBeUndefined();
  });
});
