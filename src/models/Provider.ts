import mongoose from 'mongoose';
import { applyPreFilter } from './sessionFilter';

/**
 * Provider configuration: everything needed to recognise a provider's mail and
 * attribute the documents it sends to the right meter.
 */
const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  senders: { type: [String], default: [] },
  subjectHints: { type: [String], default: [] },
  /** Optional raw Gmail search query; wins over the generated sender query. */
  gmailQuery: { type: String },
  portalUrl: { type: String },
  defaultUnit: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

providerSchema.index({ userId: 1, name: 1 }, { unique: true });

applyPreFilter(providerSchema);

const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema);
export default Provider;
