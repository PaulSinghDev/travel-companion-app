
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type GetMessagesInput, type Message } from '../schema';
import { eq, or, desc } from 'drizzle-orm';

export const getMessages = async (input: GetMessagesInput): Promise<Message[]> => {
  try {
    // Build the complete query in one expression based on input parameters
    const results = await (() => {
      const baseQuery = db.select()
        .from(messagesTable)
        .where(
          or(
            eq(messagesTable.sender_id, input.user_id),
            eq(messagesTable.recipient_id, input.user_id)
          )
        )
        .orderBy(desc(messagesTable.created_at));

      // Apply pagination parameters
      if (input.limit !== undefined && input.offset !== undefined) {
        return baseQuery.limit(input.limit).offset(input.offset);
      } else if (input.limit !== undefined) {
        return baseQuery.limit(input.limit);
      } else if (input.offset !== undefined) {
        return baseQuery.offset(input.offset);
      } else {
        return baseQuery;
      }
    })().execute();

    return results;
  } catch (error) {
    console.error('Get messages failed:', error);
    throw error;
  }
};
