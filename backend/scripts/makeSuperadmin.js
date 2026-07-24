import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const makeSuperadmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment or .env file');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'poovendranhari@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email "${email}" not found.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email}). Current role: ${user.role}`);
    
    user.role = 'superadmin';
    await user.save();
    
    console.log(`Successfully updated user role to 'superadmin'.`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating user to super admin:', err);
    process.exit(1);
  }
};

makeSuperadmin();
