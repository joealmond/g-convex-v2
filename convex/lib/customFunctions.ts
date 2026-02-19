import { customQuery, customMutation } from "convex-helpers/server/customFunctions";
import { query, mutation } from "../_generated/server";
import { requireAuth, requireAdmin } from "./authHelpers";

export const authQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAuth(ctx);
    return { ctx: { ...ctx, user, userId: user._id }, args };
  },
});

export const authMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAuth(ctx);
    return { ctx: { ...ctx, user, userId: user._id }, args };
  },
});

export const adminQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    return { ctx: { ...ctx, user, userId: user._id }, args };
  },
});

export const adminMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    return { ctx: { ...ctx, user, userId: user._id }, args };
  },
});
