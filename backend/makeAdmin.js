import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
   await User.updateMany({}, { role: 'superadmin' });
   console.log('Successfully upgraded remote users to Super Admin');
   process.exit(0);
}).catch(err => {
   console.error(err);
   process.exit(1);
});
