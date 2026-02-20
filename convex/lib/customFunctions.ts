import { customQuery, customMutation, customAction } from "convex-helpers/server/customFunctions";
import { query, mutation, action, internalQuery as rawInternalQuery, internalMutation as rawInternalMutation, internalAction as rawInternalAction } from "../_generated/server";
import { requireAuth, requireAdmin } from "./authHelpers";
import { ConvexError } from "convex/values";

/**
 * Global Exception Filter for Convex Functions
 * Logs the full error internally and returns a safe ConvexError to the client.
 */
function handleServerError(error: unknown, context: string): never {
  console.error(`[Exception in ${context}]:`, error);
  if (error instanceof ConvexError) {
    throw error;
  }
  const msg = error instanceof Error ? error.message : "Unknown error occurred";
  throw new ConvexError(msg);
}

export const authQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    try {
      const user = await requireAuth(ctx);
      return { ctx: { ...ctx, user, userId: user._id }, args };
    } catch (e) {
      handleServerError(e, 'authQuery input');
    }
  },
});

export const authMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    try {
      const user = await requireAuth(ctx);
      return { ctx: { ...ctx, user, userId: user._id }, args };
    } catch (e) {
      handleServerError(e, 'authMutation input');
    }
  },
});

export const adminQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    try {
      const user = await requireAdmin(ctx);
      return { ctx: { ...ctx, user, userId: user._id }, args };
    } catch (e) {
      handleServerError(e, 'adminQuery input');
    }
  },
});

export const adminMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    try {
      const user = await requireAdmin(ctx);
      return { ctx: { ...ctx, user, userId: user._id }, args };
    } catch (e) {
      handleServerError(e, 'adminMutation input');
    }
  },
});

export const publicQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    try {
      return { ctx, args };
    } catch (e) {
      handleServerError(e, 'publicQuery input');
    }
  },
});

export const publicMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    try {
      return { ctx, args };
    } catch (e) {
      handleServerError(e, 'publicMutation input');
    }
  },
});

export const publicAction = customAction(action, {
  args: {},
  input: async (ctx, args) => {
    try {
      return { ctx, args };
    } catch (e) {
      handleServerError(e, 'publicAction input');
    }
  },
});

export const internalQuery = customQuery(rawInternalQuery, {
  args: {},
  input: async (ctx, args) => {
    try {
      return { ctx, args };
    } catch (e) {
      handleServerError(e, 'internalQuery input');
    }
  },
});

export const internalMutation = customMutation(rawInternalMutation, {
  args: {},
  input: async (ctx, args) => {
    try {
      return { ctx, args };
    } catch (e) {
      handleServerError(e, 'internalMutation input');
    }
  },
});

export const internalAction = customAction(rawInternalAction, {
  args: {},
  input: async (ctx, args) => {
    try {
      return { ctx, args };
    } catch (e) {
      handleServerError(e, 'internalAction input');
    }
  },
});

