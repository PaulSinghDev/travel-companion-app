
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, travelDocumentsTable } from '../db/schema';
import { type CreateUserInput, type CreateTravelDocumentInput } from '../schema';
import { getUserDocuments } from '../handlers/get_user_documents';

// Test data
const testUser: CreateUserInput = {
  email: 'traveler@example.com',
  name: 'Test Traveler',
  is_discoverable: true
};

const testDocument: CreateTravelDocumentInput = {
  user_id: 'user-123',
  name: 'My Passport',
  type: 'passport',
  file_hash: 'abc123def456',
  file_url: 'https://example.com/passport.pdf',
  file_size: 1024000,
  mime_type: 'application/pdf'
};

const testDocument2: CreateTravelDocumentInput = {
  user_id: 'user-123',
  name: 'Travel Visa',
  type: 'visa',
  file_hash: 'xyz789ghi012',
  file_url: 'https://example.com/visa.pdf',
  file_size: 512000,
  mime_type: 'application/pdf'
};

describe('getUserDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no documents', async () => {
    // Create user first
    await db.insert(usersTable)
      .values({
        id: 'user-123',
        email: testUser.email,
        name: testUser.name,
        is_discoverable: testUser.is_discoverable || false,
        interests: [],
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    const result = await getUserDocuments({ user_id: 'user-123' });

    expect(result).toEqual([]);
  });

  it('should return user documents', async () => {
    // Create user first
    await db.insert(usersTable)
      .values({
        id: 'user-123',
        email: testUser.email,
        name: testUser.name,
        is_discoverable: testUser.is_discoverable || false,
        interests: [],
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    // Create documents
    await db.insert(travelDocumentsTable)
      .values({
        id: 'doc-1',
        user_id: testDocument.user_id,
        name: testDocument.name,
        type: testDocument.type,
        file_hash: testDocument.file_hash,
        file_url: testDocument.file_url,
        file_size: testDocument.file_size,
        mime_type: testDocument.mime_type,
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    await db.insert(travelDocumentsTable)
      .values({
        id: 'doc-2',
        user_id: testDocument2.user_id,
        name: testDocument2.name,
        type: testDocument2.type,
        file_hash: testDocument2.file_hash,
        file_url: testDocument2.file_url,
        file_size: testDocument2.file_size,
        mime_type: testDocument2.mime_type,
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    const result = await getUserDocuments({ user_id: 'user-123' });

    expect(result).toHaveLength(2);
    
    // Check first document
    const passportDoc = result.find(doc => doc.type === 'passport');
    expect(passportDoc).toBeDefined();
    expect(passportDoc!.name).toEqual('My Passport');
    expect(passportDoc!.file_hash).toEqual('abc123def456');
    expect(passportDoc!.file_url).toEqual('https://example.com/passport.pdf');
    expect(passportDoc!.file_size).toEqual(1024000);
    expect(passportDoc!.mime_type).toEqual('application/pdf');
    expect(passportDoc!.created_at).toBeInstanceOf(Date);
    expect(passportDoc!.updated_at).toBeInstanceOf(Date);

    // Check second document
    const visaDoc = result.find(doc => doc.type === 'visa');
    expect(visaDoc).toBeDefined();
    expect(visaDoc!.name).toEqual('Travel Visa');
    expect(visaDoc!.file_hash).toEqual('xyz789ghi012');
    expect(visaDoc!.file_url).toEqual('https://example.com/visa.pdf');
    expect(visaDoc!.file_size).toEqual(512000);
  });

  it('should only return documents for specified user', async () => {
    // Create two users
    await db.insert(usersTable)
      .values([
        {
          id: 'user-123',
          email: 'user1@example.com',
          name: 'User 1',
          is_discoverable: false,
          interests: [],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'user-456',
          email: 'user2@example.com',
          name: 'User 2',
          is_discoverable: false,
          interests: [],
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .execute();

    // Create documents for both users
    await db.insert(travelDocumentsTable)
      .values([
        {
          id: 'doc-1',
          user_id: 'user-123',
          name: 'User 1 Passport',
          type: 'passport',
          file_hash: 'hash1',
          file_url: 'https://example.com/user1-passport.pdf',
          file_size: 1000,
          mime_type: 'application/pdf',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'doc-2',
          user_id: 'user-456',
          name: 'User 2 Passport',
          type: 'passport',
          file_hash: 'hash2',
          file_url: 'https://example.com/user2-passport.pdf',
          file_size: 2000,
          mime_type: 'application/pdf',
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .execute();

    const result = await getUserDocuments({ user_id: 'user-123' });

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('User 1 Passport');
    expect(result[0].user_id).toEqual('user-123');
  });
});
