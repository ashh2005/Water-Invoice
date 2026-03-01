import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const seedUsers = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/water_collection_system';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping');
    } else {
      await User.create({
        username: 'admin',
        email: 'admin@watercollection.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Default admin user created (username: admin, password: admin123)');
    }

    const existingStaff = await User.findOne({ username: 'staff' });
    if (existingStaff) {
      console.log('Staff user already exists, skipping');
    } else {
      await User.create({
        username: 'staff',
        email: 'staff@watercollection.com',
        password: 'staff123',
        role: 'staff',
      });
      console.log('Default staff user created (username: staff, password: staff123)');
    }

    await mongoose.disconnect();
    console.log('Seed complete');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedUsers();
