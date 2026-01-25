import { Schema } from "mongoose";

/**
 * Applies a pre-filter to all query and update operations to ensure
 * they are always isolated by userId.
 * This is a critical security feature for multi-tenancy.
 */
export function applyPreFilter(schema: Schema) {
  // Queries
  schema.pre(['find', 'findOne', 'countDocuments', 'aggregate'], function () {
    const userId = this.getOptions().userId;
    if (userId) {
      this.where({ userId });
    }
  });

  // Updates and Deletes
  schema.pre(['updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'findOneAndDelete'], function () {
    const userId = this.getOptions().userId;
    if (userId) {
      this.where({ userId });
    }
  });
}
