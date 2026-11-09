import assert from 'node:assert/strict';
import dotenv from 'dotenv'; import mongoose from 'mongoose';
import { connectDatabase } from './src/config/database.js'; import User from './src/models/User.js';
import { createToken } from './src/utils/jwt.js'; import { protect, authorizeRoles } from './src/middleware/authMiddleware.js';
dotenv.config({ path: new URL('./.env', import.meta.url) });
const marker = `phase4-rbac-${Date.now()}@example.test`; const created = [];
const run = (middleware, req) => new Promise((resolve) => { const res = { status(code) { this.code = code; return this; }, json(body) { resolve({ code: this.code, body }); } }; middleware(req, res, () => resolve({ code: 200 })); });
try { await connectDatabase(); for (const role of ['customer', 'admin', 'employee']) created.push(await User.create({ name: `Phase 4 ${role}`, email: `${role}-${marker}`, password: 'SecurePass123', role }));
  for (const user of created) { const req = { headers: { authorization: `Bearer ${createToken(user)}` } }; assert.equal((await run(protect, req)).code, 200); const allowed = await run(authorizeRoles(user.role), req); assert.equal(allowed.code, 200); const denied = await run(authorizeRoles(user.role === 'admin' ? 'customer' : 'admin'), req); assert.equal(denied.code, 403); }
  console.info('Customer, admin, and employee authentication/RBAC checks passed.');
} finally { if (created.length) await User.deleteMany({ _id: { $in: created.map((user) => user._id) } }); await mongoose.disconnect(); }
