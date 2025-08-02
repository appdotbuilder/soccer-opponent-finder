
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerUserInputSchema,
  loginUserInputSchema,
  createMatchPostInputSchema,
  updateMatchPostInputSchema,
  matchPostFiltersSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createMatchPost } from './handlers/create_match_post';
import { getMatchPosts } from './handlers/get_match_posts';
import { getMatchPostById } from './handlers/get_match_post_by_id';
import { updateMatchPost } from './handlers/update_match_post';
import { deleteMatchPost } from './handlers/delete_match_post';
import { getUserMatchPosts } from './handlers/get_user_match_posts';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Match post routes
  createMatchPost: publicProcedure
    .input(createMatchPostInputSchema)
    .mutation(({ input }) => createMatchPost(input)),

  getMatchPosts: publicProcedure
    .input(matchPostFiltersSchema.optional())
    .query(({ input }) => getMatchPosts(input)),

  getMatchPostById: publicProcedure
    .input(z.number())
    .query(({ input }) => getMatchPostById(input)),

  updateMatchPost: publicProcedure
    .input(updateMatchPostInputSchema)
    .mutation(({ input }) => updateMatchPost(input)),

  deleteMatchPost: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteMatchPost(input)),

  getUserMatchPosts: publicProcedure
    .input(z.number())
    .query(({ input }) => getUserMatchPosts(input)),
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
