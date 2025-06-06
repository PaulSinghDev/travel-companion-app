
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type GetMessagesInput } from '../schema';
import { getMessages } from '../handlers/get_messages';

// Create test users
const createTestUsers = async () => {
  const users = await db.insert(usersTable)
    .values([
      {
        id: 'user1',
        email: 'user1@example.com',
        interests: [],
        is_discoverable: false
      },
      {
        id: 'user2',
        email: 'user2@example.com',
        interests: [],
        is_discoverable: false
      },
      {
        id: 'user3',
        email: 'user3@example.com',
        interests: [],
        is_discoverable: false
      }
    ])
    .returning()
    .execute();
  
  return users;
};

// Create test messages
const createTestMessages = async () => {
  const messages = await db.insert(messagesTable)
    .values([
      {
        id: 'msg1',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Hello from user1 to user2',
        is_read: false
      },
      {
        id: 'msg2',
        sender_id: 'user2',
        recipient_id: 'user1',
        content: 'Reply from user2 to user1',
        is_read: true
      },
      {
        id: 'msg3',
        sender_id: 'user3',
        recipient_id: 'user1',
        content: 'Message from user3 to user1',
        is_read: false
      },
      {
        id: 'msg4',
        sender_id: 'user2',
        recipient_id: 'user3',
        content: 'Message from user2 to user3',
        is_read: false
      }
    ])
    .returning()
    .execute();
  
  return messages;
};

describe('getMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get messages for a user as sender and recipient', async () => {
    await createTestUsers();
    await createTestMessages();

    const input: GetMessagesInput = {
      user_id: 'user1'
    };

    const result = await getMessages(input);

    // user1 should have 3 messages: sent to user2, received from user2, received from user3
    expect(result).toHaveLength(3);
    
    // Check message content and participants
    const messageContents = result.map(msg => msg.content);
    expect(messageContents).toContain('Hello from user1 to user2');
    expect(messageContents).toContain('Reply from user2 to user1');
    expect(messageContents).toContain('Message from user3 to user1');

    // Verify user1 is involved in all messages
    result.forEach(message => {
      expect(
        message.sender_id === 'user1' || message.recipient_id === 'user1'
      ).toBe(true);
    });
  });

  it('should return messages in descending order by created_at', async () => {
    await createTestUsers();
    await createTestMessages();

    const input: GetMessagesInput = {
      user_id: 'user1'
    };

    const result = await getMessages(input);

    // Verify messages are in descending order by created_at
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].created_at >= result[i].created_at).toBe(true);
    }
  });

  it('should respect limit parameter', async () => {
    await createTestUsers();
    await createTestMessages();

    const input: GetMessagesInput = {
      user_id: 'user1',
      limit: 2
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(2);
  });

  it('should respect offset parameter', async () => {
    await createTestUsers();
    await createTestMessages();

    // Get all messages first
    const allMessages = await getMessages({ user_id: 'user1' });
    
    // Get messages with offset
    const input: GetMessagesInput = {
      user_id: 'user1',
      offset: 1
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(allMessages.length - 1);
    expect(result[0].id).toEqual(allMessages[1].id);
  });

  it('should return empty array for user with no messages', async () => {
    await createTestUsers();
    await createTestMessages();

    const input: GetMessagesInput = {
      user_id: 'nonexistent-user'
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(0);
  });

  it('should handle pagination correctly', async () => {
    await createTestUsers();
    await createTestMessages();

    const input: GetMessagesInput = {
      user_id: 'user1',
      limit: 1,
      offset: 1
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(1);
    
    // Get all messages to verify we got the correct one
    const allMessages = await getMessages({ user_id: 'user1' });
    expect(result[0].id).toEqual(allMessages[1].id);
  });

  it('should preserve message properties correctly', async () => {
    await createTestUsers();
    await createTestMessages();

    const input: GetMessagesInput = {
      user_id: 'user1'
    };

    const result = await getMessages(input);

    result.forEach(message => {
      expect(message.id).toBeDefined();
      expect(message.sender_id).toBeDefined();
      expect(message.recipient_id).toBeDefined();
      expect(message.content).toBeDefined();
      expect(typeof message.is_read).toBe('boolean');
      expect(message.created_at).toBeInstanceOf(Date);
    });
  });
});
