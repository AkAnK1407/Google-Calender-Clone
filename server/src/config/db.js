const mongoose = require('mongoose');

let connection = null;

const connectDB = async () => {
  if (connection) {
    return connection;
  }

  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI in environment variables.');
  }

  mongoose.set('strictQuery', true);

  try {
    connection = await mongoose.connect(uri, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: 5000,
    });

    mongoose.connection.on('disconnected', () => {
      connection = null;
    });

    return connection;
  } catch (error) {
    connection = null;
    throw error;
  }
};

module.exports = connectDB;
