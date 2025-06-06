
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, travelDocumentsTable } from '../db/schema';
import { deleteTravelDocument } from '../handlers/delete_travel_document';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  bio: null,
  location: null,
  interests: [],
  is_discoverable: false
};

const testDocument = {
  id: 'doc-1',
  user_id: 'user-1',
  name: 'Test Document',
  type: 'passport' as const,
  file_hash: 'abc123',
  file_url: 'https://example.com/doc.pdf',
  file_size: 1024,
  mime_type: 'application/pdf'
};

describe('deleteTravelDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a travel document', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create travel document
    await db.insert(travelDocumentsTable).values(testDocument).execute();

    // Verify document exists
    const documentsBefore = await db.select()
      .from(travelDocumentsTable)
      .where(eq(travelDocumentsTable.id, 'doc-1'))
      .execute();
    expect(documentsBefore).toHaveLength(1);

    // Delete the document
    await deleteTravelDocument('doc-1');

    // Verify document is deleted
    const documentsAfter = await db.select()
      .from(travelDocumentsTable)
      .where(eq(travelDocumentsTable.id, 'doc-1'))
      .execute();
    expect(documentsAfter).toHaveLength(0);
  });

  it('should handle deleting non-existent document', async () => {
    // Should not throw error when deleting non-existent document
    await expect(deleteTravelDocument('non-existent-id')).resolves.toBeUndefined();

    // Verify no documents exist
    const documents = await db.select()
      .from(travelDocumentsTable)
      .execute();
    expect(documents).toHaveLength(0);
  });

  it('should delete only the specified document', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create multiple travel documents
    const document1 = { ...testDocument, id: 'doc-1' };
    const document2 = { ...testDocument, id: 'doc-2', name: 'Second Document' };
    
    await db.insert(travelDocumentsTable).values([document1, document2]).execute();

    // Delete only the first document
    await deleteTravelDocument('doc-1');

    // Verify only the first document is deleted
    const remainingDocuments = await db.select()
      .from(travelDocumentsTable)
      .execute();
    
    expect(remainingDocuments).toHaveLength(1);
    expect(remainingDocuments[0].id).toEqual('doc-2');
    expect(remainingDocuments[0].name).toEqual('Second Document');
  });
});
