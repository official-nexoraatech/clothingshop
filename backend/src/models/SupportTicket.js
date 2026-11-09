import mongoose from 'mongoose';
import { Schema, ref } from './helpers.js';

const schema = new Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true },
  customer: ref('User', { required: true, index: true }),
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  category: { type: String, required: true, enum: ['Order', 'Payment', 'Product', 'Delivery', 'Return', 'Account', 'Other'], index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium', index: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'], default: 'Open', index: true },
  assignedTo: ref('User')
}, { timestamps: true, collection: 'supportTickets' });
schema.index({ customer: 1, createdAt: -1 });
schema.index({ status: 1, priority: 1, createdAt: -1 });
export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', schema);
