import mongoose from 'mongoose';

/**
 * Google account link. Deliberately separate from authentication: the app keeps
 * its own password login and only borrows Gmail read + Drive write access.
 * `refreshToken` is stored encrypted (see lib/encryption.ts).
 */
const googleSchema = new mongoose.Schema({
  sub: { type: String },
  email: { type: String },
  refreshToken: { type: String },
  scopes: { type: [String], default: [] },
  connectedAt: { type: Date },
  lastSyncAt: { type: Date },
  lastHistoryId: { type: String },
  /** Root Drive folder owned by this app ("Energy Monitor"). */
  rootFolderId: { type: String },
  status: { type: String, enum: ['ok', 'reconnect_required'], default: 'ok' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  googleApiKey: { type: String },
  google: { type: googleSchema, default: undefined },
  stats: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
