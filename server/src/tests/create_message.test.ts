
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { messagesTable, usersTable } from '../db/schema';
import { type CreateMessageInput } from '../schema';
import { createMessage } from '../handlers/create_message';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('createMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a message', async () => {
    // Create prerequisite users
    const senderId = nanoid();
    const recipientId = nanoid();
    
    await db.insert(usersTable).values([
      {
        id: senderId,
        email: 'sender@example.com',
        name: 'Sender User',
        interests: [],
        is_discoverable: false
      },
      {
        id: recipientId,
        email: 'recipient@example.com',
        name: 'Recipient User',
        interests: [],
        is_discoverable: false
      }
    ]).execute();

    const testInput: CreateMessageInput = {
      sender_id: senderId,
      recipient_id: recipientId,
      content: 'Hello, how are you?'
    };

    const result = await createMessage(testInput);

    // Basic field validation
    expect(result.sender_id).toEqual(senderId);
    expect(result.recipient_id).toEqual(recipientId);
    expect(result.content).toEqual('Hello, how are you?');
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    // Create prerequisite users
    const senderId = nanoid();
    const recipientId = nanoid();
    
    await db.insert(usersTable).values([
      {
        id: senderId,
        email: 'sender@example.com',
        name: 'Sender User',
        interests: [],
        is_discoverable: false
      },
      {
        id: recipientId,
        email: 'recipient@example.com',
        name: 'Recipient User',
        interests: [],
        is_discoverable: false
      }
    ]).execute();

    const testInput: CreateMessageInput = {
      sender_id: senderId,
      recipient_id: recipientId,
      content: 'Test message content'
    };

    const result = await createMessage(testInput);

    // Query using proper drizzle syntax
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].sender_id).toEqual(senderId);
    expect(messages[0].recipient_id).toEqual(recipientId);
    expect(messages[0].content).toEqual('Test message content');
    expect(messages[0].is_read).toEqual(false);
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key constraint violation', async () => {
    const testInput: CreateMessageInput = {
      sender_id: 'nonexistent-sender',
      recipient_id: 'nonexistent-recipient',
      content: 'This should fail'
    };

    await expect(createMessage(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
