import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User, Note, Post } from '../models/index.js';

const seed = async () => {
  try {
    await connectDatabase();
    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Note.deleteMany({});
    await Post.deleteMany({});

    console.log('[Seed] Seeding users...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      interests: ['security', 'cloud', 'architecture'],
    });

    const alice = await User.create({
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'user123',
      role: 'user',
      interests: ['chess', 'reading', 'coding'],
    });

    const bob = await User.create({
      name: 'Bob Jones',
      email: 'bob@example.com',
      password: 'user123',
      role: 'user',
      interests: ['chess', 'hiking'],
    });

    const charlie = await User.create({
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      password: 'user123',
      role: 'user',
      interests: ['reading', 'photography'],
    });

    console.log('[Seed] Seeding sample notes...');
    await Note.create([
      {
        title: 'Alice Project Roadmap',
        content: 'Review backend indexing and aggregation performance before submission.',
        user: alice._id,
      },
      {
        title: 'Alice Weekly Goals',
        content: 'Practice algorithmic problems and read clean code guidelines.',
        user: alice._id,
      },
      {
        title: 'Bob Hiking Gear Checklist',
        content: 'Backpack, water bottle, trail shoes, and compass.',
        user: bob._id,
      },
      {
        title: 'Admin Security Audit Checklist',
        content: 'Ensure all JWT secrets are rotated and bcrypt rounds are configured.',
        user: admin._id,
      },
    ]);

    console.log('[Seed] Seeding sample posts for lookup aggregation...');
    await Post.create([
      {
        title: 'Getting started with MongoDB Aggregations',
        content: 'Pipeline stages like $unwind and $lookup unlock deep analytics in NoSQL.',
        authorId: alice._id,
      },
      {
        title: 'The Beauty of Chess Endgames',
        content: 'Pawn structures dictate the outcome of master tournaments.',
        authorId: alice._id,
      },
      {
        title: 'Weekend Trail in High Peaks',
        content: 'Climbed 3500 feet elevation today. Breath-taking views from the summit!',
        authorId: bob._id,
      },
      {
        title: 'Photography in Golden Hour',
        content: 'Natural lighting at 6 PM produces unbeatable warm portraits.',
        authorId: charlie._id,
      },
    ]);

    console.log('[Seed] Seeding completed successfully!');
    console.log('[Seed] Default Credentials:');
    console.log('       Admin: admin@example.com / admin123');
    console.log('       User:  alice@example.com / user123');
    console.log('       User:  bob@example.com   / user123');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
