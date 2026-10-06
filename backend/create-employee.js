import dotenv from 'dotenv'; import mongoose from 'mongoose';
import { connectDatabase } from './src/config/database.js'; import User from './src/models/User.js';
dotenv.config({ path: new URL('./.env', import.meta.url) });
const { EMPLOYEE_NAME, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD } = process.env;
if (!EMPLOYEE_NAME || !EMPLOYEE_EMAIL || !EMPLOYEE_PASSWORD) throw new Error('Set EMPLOYEE_NAME, EMPLOYEE_EMAIL, and EMPLOYEE_PASSWORD in backend/.env before creating an employee.');
try { await connectDatabase(); const email = EMPLOYEE_EMAIL.trim().toLowerCase(); if (await User.exists({ email })) throw new Error('A user with this email already exists.'); await User.create({ name: EMPLOYEE_NAME.trim(), email, password: EMPLOYEE_PASSWORD, role: 'employee', status: 'active' }); console.info(`Employee account created for ${email}.`); } finally { await mongoose.disconnect(); }
