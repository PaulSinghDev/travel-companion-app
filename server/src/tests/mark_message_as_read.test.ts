
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type MarkMessageAsReadInput } from '../schema';
import { markMessageAsRead } from '../handlers/mark_message_as_read';
import { eq } from 'drizzle-orm';

describe('markMessageAsRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark a message as read when user is recipient', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        id: 'sender-1',
        email: 'sender@example.com',
        interests: [],
        is_discoverable: false
      },
      {
        id: 'recipient-1',
        email: 'recipient@example.com',
        interests: [],
        is_discoverable: false
      }
    ]).execute();

    // Create a test message
    await db.insert(messagesTable).values({
      id: 'message-1',
      sender_id: 'sender-1',
      recipient_id: 'recipient-1',
      content: 'Test message',
      is_read: false
    }).execute();

    const input: MarkMessageAsReadInput = {
      message_id: 'message-1',
      user_id: 'recipient-1'
    };

    await markMessageAsRead(input);

    // Verify message is marked as read
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, 'message-1'))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].is_read).toBe(true);
  });

  it('should not mark message as read when user is not the recipient', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        id: 'sender-1',
        email: 'sender@example.com',
        interests: [],
        is_discoverable: false
      },
      {
        id: 'recipient-1',
        email: 'recipient@example.com',
        interests: [],
        is_discoverable: false
      },
      {
        id: 'other-user',
        email: 'other@example.com',
        interests: [],
        is_discoverable: false
      }
    ]).execute();

    // Create a test message
    await db.insert(messagesTable).values({
      id: 'message-1',
      sender_id: 'sender-1',
      recipient_id: 'recipient-1',
      content: 'Test message',
      is_read: false
    }).execute();

    const input: MarkMessageAsReadInput = {
      message_id: 'message-1',
      user_id: 'other-user' // Different user trying to mark message as read
    };

    await markMessageAsRead(input);

    // Verify message is still unread (not updated)
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, 'message-1'))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].is_read).toBe(false);
  });

  it('should handle non-existent message gracefully', async () => {
    // Create test user
    await db.insert(usersTable).values({
      id: 'user-1',
      email: 'user@example.com',
      interests: [],
      is_discoverable: false
    }).execute();

    const input: MarkMessageAsReadInput = {
      message_id: 'non-existent-message',
      user_id: 'user-1'
    };

    // Should not throw an error
    await markMessageAsRead(input);

    // Verify no messages exist
    const messages = await db.select()
      .from(messagesTable)
      .execute();

    expect(messages).toHaveLength(0);
  });

  it('should not affect already read messages', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        id: 'sender-1',
        email: 'sender@example.com',
        interests: [],
        is_discoverable: false
      },
      {
        id: 'recipient-1',
        email: 'recipient@example.com',
        interests: [],
        is_discoverable: false
      }
    ]).execute();

    // Create a test message that's already read
    await db.insert(messagesTable).values({
      id: 'message-1',
      sender_id: 'sender-1',
      recipient_id: 'recipient-1',
      content: 'Test message',
      is_read: true
    }).execute();

    const input: MarkMessageAsReadInput = {
      message_id: 'message-1',
      user_id: 'recipient-1'
    };

    await markMessageAsRead(input);

    // Verify message is still read
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, 'message-1'))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].is_read).toBe(true);
  });
});
