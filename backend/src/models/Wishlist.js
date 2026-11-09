import mongoose from 'mongoose'; import { Schema, ref } from './helpers.js';
const schema = new Schema({ user: ref('User', { required: true, unique: true }), products: { type: [ref('Product')], default: [], validate: { validator: (products) => new Set(products.map(String)).size === products.length, message: 'A product can appear only once in a wishlist.' } } }, { timestamps: true, collection: 'wishlists' });
export default mongoose.models.Wishlist || mongoose.model('Wishlist', schema);
