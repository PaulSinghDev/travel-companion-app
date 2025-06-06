
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type MarkMessageAsReadInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const markMessageAsRead = async (input: MarkMessageAsReadInput): Promise<void> => {
  try {
    // Update the message to mark as read, but only if the user is the recipient
    await db.update(messagesTable)
      .set({ 
        is_read: true 
      })
      .where(
        and(
          eq(messagesTable.id, input.message_id),
          eq(messagesTable.recipient_id, input.user_id)
        )
      )
      .execute();
  } catch (error) {
    console.error('Mark message as read failed:', error);
    throw error;
  }
};
