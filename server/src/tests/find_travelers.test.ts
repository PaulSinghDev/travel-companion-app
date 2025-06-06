
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type FindTravelersInput } from '../schema';
import { findTravelers } from '../handlers/find_travelers';

describe('findTravelers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should find discoverable travelers excluding requesting user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          location: 'Paris',
          interests: ['travel', 'food'],
          is_discoverable: true
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          location: 'London',
          interests: ['music', 'art'],
          is_discoverable: true
        },
        {
          id: 'user3',
          email: 'user3@example.com',
          name: 'User Three',
          location: 'Paris',
          interests: ['travel', 'photography'],
          is_discoverable: false // Not discoverable
        }
      ])
      .returning()
      .execute();

    const input: FindTravelersInput = {
      user_id: 'user1'
    };

    const result = await findTravelers(input);

    // Should return only user2 (user3 is not discoverable, user1 is excluded)
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('user2');
    expect(result[0].name).toEqual('User Two');
    expect(result[0].is_discoverable).toBe(true);
  });

  it('should filter by location when provided', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          location: 'Paris',
          interests: ['travel'],
          is_discoverable: true
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          location: 'London',
          interests: ['travel'],
          is_discoverable: true
        },
        {
          id: 'user3',
          email: 'user3@example.com',
          name: 'User Three',
          location: 'Paris',
          interests: ['food'],
          is_discoverable: true
        }
      ])
      .execute();

    const input: FindTravelersInput = {
      user_id: 'user1',
      location: 'Paris'
    };

    const result = await findTravelers(input);

    // Should return only user3 (same location, excluding user1)
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('user3');
    expect(result[0].location).toEqual('Paris');
  });

  it('should filter by interests when provided', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          location: 'Paris',
          interests: ['travel', 'food'],
          is_discoverable: true
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          location: 'London',
          interests: ['travel', 'photography'],
          is_discoverable: true
        },
        {
          id: 'user3',
          email: 'user3@example.com',
          name: 'User Three',
          location: 'Berlin',
          interests: ['music', 'art'],
          is_discoverable: true
        }
      ])
      .execute();

    const input: FindTravelersInput = {
      user_id: 'user1',
      interests: ['travel']
    };

    const result = await findTravelers(input);

    // Should return user2 (has travel interest, excluding user1)
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('user2');
    expect(result[0].interests).toContain('travel');
  });

  it('should apply limit when provided', async () => {
    // Create multiple test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          interests: ['travel'],
          is_discoverable: true
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          interests: ['travel'],
          is_discoverable: true
        },
        {
          id: 'user3',
          email: 'user3@example.com',
          name: 'User Three',
          interests: ['travel'],
          is_discoverable: true
        },
        {
          id: 'user4',
          email: 'user4@example.com',
          name: 'User Four',
          interests: ['travel'],
          is_discoverable: true
        }
      ])
      .execute();

    const input: FindTravelersInput = {
      user_id: 'user1',
      limit: 2
    };

    const result = await findTravelers(input);

    // Should return only 2 users (excluding user1)
    expect(result).toHaveLength(2);
    result.forEach(user => {
      expect(user.id).not.toEqual('user1');
      expect(user.is_discoverable).toBe(true);
    });
  });

  it('should combine location and interests filters', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          location: 'Paris',
          interests: ['travel', 'food'],
          is_discoverable: true
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          location: 'Paris',
          interests: ['travel', 'photography'],
          is_discoverable: true
        },
        {
          id: 'user3',
          email: 'user3@example.com',
          name: 'User Three',
          location: 'London',
          interests: ['travel', 'music'],
          is_discoverable: true
        },
        {
          id: 'user4',
          email: 'user4@example.com',
          name: 'User Four',
          location: 'Paris',
          interests: ['music', 'art'],
          is_discoverable: true
        }
      ])
      .execute();

    const input: FindTravelersInput = {
      user_id: 'user1',
      location: 'Paris',
      interests: ['travel']
    };

    const result = await findTravelers(input);

    // Should return only user2 (Paris location AND travel interest, excluding user1)
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('user2');
    expect(result[0].location).toEqual('Paris');
    expect(result[0].interests).toContain('travel');
  });

  it('should return empty array when no travelers match criteria', async () => {
    // Create test user
    await db.insert(usersTable)
      .values([
        {
          id: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          location: 'Paris',
          interests: ['travel'],
          is_discoverable: false // Not discoverable
        }
      ])
      .execute();

    const input: FindTravelersInput = {
      user_id: 'user2',
      location: 'London'
    };

    const result = await findTravelers(input);

    expect(result).toHaveLength(0);
  });
});
