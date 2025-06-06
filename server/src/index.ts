
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createTravelPlanInputSchema,
  getUserTravelPlansInputSchema,
  updateTravelPlanInputSchema,
  createTravelDocumentInputSchema,
  getUserDocumentsInputSchema,
  createPostInputSchema,
  getPostsInputSchema,
  createMessageInputSchema,
  getMessagesInputSchema,
  markMessageAsReadInputSchema,
  findTravelersInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUser } from './handlers/get_user';
import { updateUser } from './handlers/update_user';
import { createTravelPlan } from './handlers/create_travel_plan';
import { getUserTravelPlans } from './handlers/get_user_travel_plans';
import { updateTravelPlan } from './handlers/update_travel_plan';
import { deleteTravelPlan } from './handlers/delete_travel_plan';
import { createTravelDocument } from './handlers/create_travel_document';
import { getUserDocuments } from './handlers/get_user_documents';
import { deleteTravelDocument } from './handlers/delete_travel_document';
import { createPost } from './handlers/create_post';
import { getPosts } from './handlers/get_posts';
import { deletePost } from './handlers/delete_post';
import { createMessage } from './handlers/create_message';
import { getMessages } from './handlers/get_messages';
import { markMessageAsRead } from './handlers/mark_message_as_read';
import { findTravelers } from './handlers/find_travelers';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUser: publicProcedure
    .input(z.string())
    .query(({ input }) => getUser(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Travel plan management
  createTravelPlan: publicProcedure
    .input(createTravelPlanInputSchema)
    .mutation(({ input }) => createTravelPlan(input)),
  
  getUserTravelPlans: publicProcedure
    .input(getUserTravelPlansInputSchema)
    .query(({ input }) => getUserTravelPlans(input)),
  
  updateTravelPlan: publicProcedure
    .input(updateTravelPlanInputSchema)
    .mutation(({ input }) => updateTravelPlan(input)),
  
  deleteTravelPlan: publicProcedure
    .input(z.string())
    .mutation(({ input }) => deleteTravelPlan(input)),

  // Travel document management
  createTravelDocument: publicProcedure
    .input(createTravelDocumentInputSchema)
    .mutation(({ input }) => createTravelDocument(input)),
  
  getUserDocuments: publicProcedure
    .input(getUserDocumentsInputSchema)
    .query(({ input }) => getUserDocuments(input)),
  
  deleteTravelDocument: publicProcedure
    .input(z.string())
    .mutation(({ input }) => deleteTravelDocument(input)),

  // Social features - Posts
  createPost: publicProcedure
    .input(createPostInputSchema)
    .mutation(({ input }) => createPost(input)),
  
  getPosts: publicProcedure
    .input(getPostsInputSchema.optional())
    .query(({ input }) => getPosts(input)),
  
  deletePost: publicProcedure
    .input(z.string())
    .mutation(({ input }) => deletePost(input)),

  // Social features - Messaging
  createMessage: publicProcedure
    .input(createMessageInputSchema)
    .mutation(({ input }) => createMessage(input)),
  
  getMessages: publicProcedure
    .input(getMessagesInputSchema)
    .query(({ input }) => getMessages(input)),
  
  markMessageAsRead: publicProcedure
    .input(markMessageAsReadInputSchema)
    .mutation(({ input }) => markMessageAsRead(input)),

  // Social features - Discovery
  findTravelers: publicProcedure
    .input(findTravelersInputSchema)
    .query(({ input }) => findTravelers(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
