import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDummyUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const event = await Event.findOne();
    if (!event) {
      console.log('No event found. Please create an event first.');
      process.exit(0);
    }

    console.log(`Clearing existing dummy registrations for event: ${event.title}`);
    await Registration.deleteMany({ event: event._id });

    const dummyUsersData = [
      { name: 'Alice Smith', email: 'alice@example.com', googleId: 'dummy_alice', registerNumber: '21CS001', department: 'CSE', year: 'III', mobile: '9876543210' },
      { name: 'Bob Johnson', email: 'bob@example.com', googleId: 'dummy_bob', registerNumber: '21CS002', department: 'CSE', year: 'III', mobile: '9876543211' },
      { name: 'Charlie Brown', email: 'charlie@example.com', googleId: 'dummy_charlie', registerNumber: '21EC001', department: 'ECE', year: 'II', mobile: '9876543212' },
      { name: 'David Wilson', email: 'david@example.com', googleId: 'dummy_david', registerNumber: '21EC002', department: 'ECE', year: 'II', mobile: '9876543213' },
      { name: 'Eve Davis', email: 'eve@example.com', googleId: 'dummy_eve', registerNumber: '21IT001', department: 'IT', year: 'IV', mobile: '9876543214' },
      { name: 'Frank Miller', email: 'frank@example.com', googleId: 'dummy_frank', registerNumber: '21IT002', department: 'IT', year: 'IV', mobile: '9876543215' },
      { name: 'Grace Hopper', email: 'grace@example.com', googleId: 'dummy_grace', registerNumber: '21ME001', department: 'MECH', year: 'I', mobile: '9876543216' },
      { name: 'Heidi Klum', email: 'heidi@example.com', googleId: 'dummy_heidi', registerNumber: '21ME002', department: 'MECH', year: 'I', mobile: '9876543217' },
      { name: 'Ivan Drago', email: 'ivan@example.com', googleId: 'dummy_ivan', registerNumber: '21Civil001', department: 'CIVIL', year: 'III', mobile: '9876543218' },
      { name: 'Judy Hopps', email: 'judy@example.com', googleId: 'dummy_judy', registerNumber: '21Civil002', department: 'CIVIL', year: 'III', mobile: '9876543219' },
    ];

    const users = [];
    for (const userData of dummyUsersData) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({ ...userData, isProfileComplete: true });
        console.log(`Created user: ${user.name}`);
      }
      users.push(user);
    }

    const teams = [
      { name: 'Alpha Coders', members: [0, 1, 2, 3], shortlisted: true },
      { name: 'Beta Testers', members: [4, 5, 6], shortlisted: false },
      { name: 'Gamma Knights', members: [7, 8, 9], shortlisted: true },
    ];

    for (const team of teams) {
      const leader = users[team.members[0]];
      const memberList = team.members.map(idx => ({ user: users[idx]._id, status: 'Registered' }));

      await Registration.create({
        event: event._id,
        teamLeader: leader._id,
        teamName: team.name,
        members: memberList,
        status: 'Registered',
        isShortlisted: team.shortlisted
      });
      console.log(`Registered team: ${team.name} (Leader: ${leader.name})`);
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedDummyUsers();
