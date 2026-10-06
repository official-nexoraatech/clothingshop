import dotenv from 'dotenv'; import mongoose from 'mongoose';
import { connectDatabase } from './src/config/database.js'; import User from './src/models/User.js';
dotenv.config({ path: new URL('./.env', import.meta.url) });
const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env before creating an admin.');
try { await connectDatabase(); const email = ADMIN_EMAIL.trim().toLowerCase(); if (await User.exists({ email })) throw new Error('A user with this email already exists.'); await User.create({ name: ADMIN_NAME.trim(), email, password: ADMIN_PASSWORD, role: 'admin', status: 'active' }); console.info(`Admin account created for ${email}.`); } finally { await mongoose.disconnect(); }
