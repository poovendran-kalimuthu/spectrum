import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrateSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const events = await Event.find({});
    console.log(`Found ${events.length} events in database`);

    let updatedCount = 0;
    for (const event of events) {
      // Force generating slug if missing or we want to make sure it's set
      if (!event.slug) {
        console.log(`Generating slug for event: "${event.title}"`);
        // Calling save triggers the pre-save middleware slugify logic
        await event.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} events.`);
    process.exit(0);
  } catch (err) {
    console.error('Error migrating slugs:', err);
    process.exit(1);
  }
};

migrateSlugs();
