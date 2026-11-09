import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  _id: { type: String, default: 'shop', enum: ['shop'] },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, required: true, trim: true, maxlength: 300 },
  email: { type: String, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 25 }
}, { timestamps: true, collection: 'shopSettings' });
export const defaultShopSettings = { name: 'Lavella Studio', location: 'Bengaluru, India', email: 'support@lavella.example', phone: '+91 98765 43210' };
export default mongoose.models.ShopSettings || mongoose.model('ShopSettings', schema);
