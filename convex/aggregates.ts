import { TableAggregate } from "@convex-dev/aggregate"
import { components } from "./_generated/api"
import { DataModel, Id } from "./_generated/dataModel"

export const profilesAggregate = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "profiles";
}>(components.usersAggregate, {
  sortKey: (doc) => doc._creationTime,
});

export const productsAggregate = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "products";
}>(components.productsAggregate, {
  sortKey: (doc) => doc._creationTime,
});

export const votesByProduct = new TableAggregate<{
  Namespace: Id<"products">;
  Key: number;
  DataModel: DataModel;
  TableName: "votes";
}>(components.votesByProduct, {
  namespace: (doc) => doc.productId,
  sortKey: (doc) => doc._creationTime,
});

export const followsByFollower = new TableAggregate<{
  Namespace: string;
  Key: number;
  DataModel: DataModel;
  TableName: "follows";
}>(components.followsByFollower, {
  namespace: (doc) => doc.followerId,
  sortKey: (doc) => doc._creationTime,
});

export const followsByFollowing = new TableAggregate<{
  Namespace: string;
  Key: number;
  DataModel: DataModel;
  TableName: "follows";
}>(components.followsByFollowing, {
  namespace: (doc) => doc.followingId,
  sortKey: (doc) => doc._creationTime,
});
