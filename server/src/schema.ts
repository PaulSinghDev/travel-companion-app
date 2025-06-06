
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  interests: z.array(z.string()),
  is_discoverable: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Travel plan schema
export const travelModeEnum = z.enum(['flight', 'boat', 'taxi', 'bus', 'train']);

export const travelPlanSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  mode: travelModeEnum,
  departure_time: z.coerce.date(),
  arrival_time: z.coerce.date(),
  departure_location: z.string(),
  arrival_location: z.string(),
  booking_reference: z.string().nullable(),
  duration_minutes: z.number().int().nullable(),
  travel_provider: z.string().nullable(),
  additional_info: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TravelPlan = z.infer<typeof travelPlanSchema>;

// Travel document schema
export const documentTypeEnum = z.enum(['passport', 'visa', 'id', 'ticket', 'other']);

export const travelDocumentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  type: documentTypeEnum,
  file_hash: z.string(),
  file_url: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TravelDocument = z.infer<typeof travelDocumentSchema>;

// Post schema
export const postSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  content: z.string(),
  image_urls: z.array(z.string()),
  location: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Post = z.infer<typeof postSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  recipient_id: z.string(),
  content: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type Message = z.infer<typeof messageSchema>;

// Input schemas for creating records
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(),
  is_discoverable: z.boolean().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createTravelPlanInputSchema = z.object({
  user_id: z.string(),
  mode: travelModeEnum,
  departure_time: z.coerce.date(),
  arrival_time: z.coerce.date(),
  departure_location: z.string(),
  arrival_location: z.string(),
  booking_reference: z.string().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  travel_provider: z.string().nullable().optional(),
  additional_info: z.string().nullable().optional()
});

export type CreateTravelPlanInput = z.infer<typeof createTravelPlanInputSchema>;

export const createTravelDocumentInputSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  type: documentTypeEnum,
  file_hash: z.string(),
  file_url: z.string(),
  file_size: z.number().int(),
  mime_type: z.string()
});

export type CreateTravelDocumentInput = z.infer<typeof createTravelDocumentInputSchema>;

export const createPostInputSchema = z.object({
  user_id: z.string(),
  content: z.string(),
  image_urls: z.array(z.string()).optional(),
  location: z.string().nullable().optional()
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export const createMessageInputSchema = z.object({
  sender_id: z.string(),
  recipient_id: z.string(),
  content: z.string()
});

export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

// Update schemas
export const updateUserInputSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(),
  is_discoverable: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateTravelPlanInputSchema = z.object({
  id: z.string(),
  mode: travelModeEnum.optional(),
  departure_time: z.coerce.date().optional(),
  arrival_time: z.coerce.date().optional(),
  departure_location: z.string().optional(),
  arrival_location: z.string().optional(),
  booking_reference: z.string().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  travel_provider: z.string().nullable().optional(),
  additional_info: z.string().nullable().optional()
});

export type UpdateTravelPlanInput = z.infer<typeof updateTravelPlanInputSchema>;

// Query schemas
export const getUserTravelPlansInputSchema = z.object({
  user_id: z.string(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetUserTravelPlansInput = z.infer<typeof getUserTravelPlansInputSchema>;

export const getUserDocumentsInputSchema = z.object({
  user_id: z.string()
});

export type GetUserDocumentsInput = z.infer<typeof getUserDocumentsInputSchema>;

export const getPostsInputSchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetPostsInput = z.infer<typeof getPostsInputSchema>;

export const getMessagesInputSchema = z.object({
  user_id: z.string(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const findTravelersInputSchema = z.object({
  user_id: z.string(),
  location: z.string().optional(),
  interests: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional()
});

export type FindTravelersInput = z.infer<typeof findTravelersInputSchema>;

export const markMessageAsReadInputSchema = z.object({
  message_id: z.string(),
  user_id: z.string()
});

export type MarkMessageAsReadInput = z.infer<typeof markMessageAsReadInputSchema>;
