
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type CreateMessageInput, type Message } from '../schema';
import { nanoid } from 'nanoid';

export const createMessage = async (input: CreateMessageInput): Promise<Message> => {
  try {
    // Insert message record
    const result = await db.insert(messagesTable)
      .values({
        id: nanoid(),
        sender_id: input.sender_id,
        recipient_id: input.recipient_id,
        content: input.content,
        is_read: false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Message creation failed:', error);
    throw error;
  }
};
