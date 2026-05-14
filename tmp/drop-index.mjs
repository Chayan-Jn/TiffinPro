import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await mongoose.connection.collection('providercustomers').dropIndex('providerId_1_userId_1');
    console.log("Index dropped successfully.");
  } catch (err) {
    console.log("Index drop error or already dropped:", err.message);
  }
  mongoose.disconnect();
}
fix();
