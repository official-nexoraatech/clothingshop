import mongoose from 'mongoose';
export const { Schema } = mongoose;
export const ref = (model, options = {}) => ({ type: Schema.Types.ObjectId, ref: model, ...options });
export const imageSchema = new Schema({ url: { type: String, required: true, trim: true }, alt: { type: String, trim: true, maxlength: 200 }, order: { type: Number, default: 0, min: 0 }, isPrimary: { type: Boolean, default: false } }, { _id: false });
export const phoneValidator = { validator: (value) => !value || /^[+]?\d[\d\s-]{6,19}$/.test(value), message: 'Enter a valid phone number.' };
