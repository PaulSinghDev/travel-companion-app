
import { db } from '../db';
import { travelDocumentsTable } from '../db/schema';
import { type CreateTravelDocumentInput, type TravelDocument } from '../schema';
import { nanoid } from 'nanoid';

export const createTravelDocument = async (input: CreateTravelDocumentInput): Promise<TravelDocument> => {
  try {
    // Insert travel document record
    const result = await db.insert(travelDocumentsTable)
      .values({
        id: nanoid(),
        user_id: input.user_id,
        name: input.name,
        type: input.type,
        file_hash: input.file_hash,
        file_url: input.file_url,
        file_size: input.file_size,
        mime_type: input.mime_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Travel document creation failed:', error);
    throw error;
  }
};
