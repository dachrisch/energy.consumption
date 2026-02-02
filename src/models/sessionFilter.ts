import { Schema, Query, Aggregate } from "mongoose";

/**
 * Applies a pre-filter to all query and update operations to ensure
 * they are always isolated by userId.
 * This is a critical security feature for multi-tenancy.
 */
export function applyPreFilter(schema: Schema) {
  // Queries
  const queryMethods = ['find', 'findOne', 'countDocuments'] as const;
  queryMethods.forEach(method => {
    schema.pre(method, function (this: Query<unknown, unknown>) {
      const userId = this.getOptions().userId;
      if (userId) {
        this.where({ userId });
      }
    });
  });

  // Aggregate
  schema.pre('aggregate', function (this: Aggregate<unknown>) {
    const userId = (this as Aggregate<unknown> & { options?: { userId?: string } }).options?.userId;
    if (userId) {
      this.pipeline().unshift({ $match: { userId } });
    }
  });

  // Updates and Deletes
  const updateMethods = ['updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'findOneAndDelete'] as const;
  updateMethods.forEach(method => {
    schema.pre(method, function (this: Query<unknown, unknown>) {
      const userId = this.getOptions().userId;
      if (userId) {
        this.where({ userId });
      }
    });
  });
}
