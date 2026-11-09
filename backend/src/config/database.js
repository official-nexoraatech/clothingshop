import mongoose from 'mongoose';

export async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error('MONGO_URI is required to connect to MongoDB.');
  mongoose.connection.on('error', (error) => console.error('MongoDB connection error:', error.message));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.info(`MongoDB connected (${mongoose.connection.name})`);
  return mongoose.connection;
}
