import mongoose from 'mongoose';
import { Schema, ref } from './helpers.js';
const schema = new Schema({
  ticket: ref('SupportTicket', { required: true, index: true }),
  sender: ref('User', { required: true }),
  senderRole: { type: String, enum: ['customer', 'admin', 'employee'], required: true },
  message: { type: String, required: true, trim: true, maxlength: 4000 }
}, { timestamps: true, collection: 'supportMessages' });
schema.index({ ticket: 1, createdAt: 1 });
export default mongoose.models.SupportMessage || mongoose.model('SupportMessage', schema);
