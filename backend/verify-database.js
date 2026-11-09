import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './src/config/database.js';
import * as models from './src/models/index.js';
dotenv.config({ path: new URL('./.env', import.meta.url) });

try {
  await connectDatabase();
  for (const [name, model] of Object.entries(models)) {
    await model.syncIndexes();
    console.info(`Verified ${name} indexes`);
  }
  console.info('MongoDB connection and database indexes verified');
} finally {
  await mongoose.disconnect();
}
