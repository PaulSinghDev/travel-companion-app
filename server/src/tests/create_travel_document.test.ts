
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, travelDocumentsTable } from '../db/schema';
import { type CreateTravelDocumentInput } from '../schema';
import { createTravelDocument } from '../handlers/create_travel_document';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('createTravelDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a travel document', async () => {
    // Create a user first
    const userId = nanoid();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'test@example.com',
        interests: [],
        is_discoverable: false
      })
      .execute();

    const testInput: CreateTravelDocumentInput = {
      user_id: userId,
      name: 'My Passport',
      type: 'passport',
      file_hash: 'abc123def456',
      file_url: 'https://example.com/passport.pdf',
      file_size: 1024000,
      mime_type: 'application/pdf'
    };

    const result = await createTravelDocument(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.name).toEqual('My Passport');
    expect(result.type).toEqual('passport');
    expect(result.file_hash).toEqual('abc123def456');
    expect(result.file_url).toEqual('https://example.com/passport.pdf');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('application/pdf');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save travel document to database', async () => {
    // Create a user first
    const userId = nanoid();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'test@example.com',
        interests: [],
        is_discoverable: false
      })
      .execute();

    const testInput: CreateTravelDocumentInput = {
      user_id: userId,
      name: 'Travel Visa',
      type: 'visa',
      file_hash: 'xyz789abc123',
      file_url: 'https://example.com/visa.jpg',
      file_size: 512000,
      mime_type: 'image/jpeg'
    };

    const result = await createTravelDocument(testInput);

    // Query the database to verify the document was saved
    const documents = await db.select()
      .from(travelDocumentsTable)
      .where(eq(travelDocumentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    expect(documents[0].user_id).toEqual(userId);
    expect(documents[0].name).toEqual('Travel Visa');
    expect(documents[0].type).toEqual('visa');
    expect(documents[0].file_hash).toEqual('xyz789abc123');
    expect(documents[0].file_url).toEqual('https://example.com/visa.jpg');
    expect(documents[0].file_size).toEqual(512000);
    expect(documents[0].mime_type).toEqual('image/jpeg');
    expect(documents[0].created_at).toBeInstanceOf(Date);
    expect(documents[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different document types', async () => {
    // Create a user first
    const userId = nanoid();
    await db.insert(usersTable)
      .values({
        id: userId,
        email: 'test@example.com',
        interests: [],
        is_discoverable: false
      })
      .execute();

    const documentTypes = ['passport', 'visa', 'id', 'ticket', 'other'] as const;

    for (const docType of documentTypes) {
      const testInput: CreateTravelDocumentInput = {
        user_id: userId,
        name: `Test ${docType}`,
        type: docType,
        file_hash: `hash_${docType}`,
        file_url: `https://example.com/${docType}.pdf`,
        file_size: 1000000,
        mime_type: 'application/pdf'
      };

      const result = await createTravelDocument(testInput);

      expect(result.type).toEqual(docType);
      expect(result.name).toEqual(`Test ${docType}`);
    }
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateTravelDocumentInput = {
      user_id: 'non-existent-user-id',
      name: 'Test Document',
      type: 'passport',
      file_hash: 'test_hash',
      file_url: 'https://example.com/test.pdf',
      file_size: 1000000,
      mime_type: 'application/pdf'
    };

    await expect(createTravelDocument(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
