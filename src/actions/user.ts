'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function updateProfile(name: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    if (!name) {
      throw new Error('Name is required');
    }

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { name },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return { success: true, user: { name: user.name, email: user.email } };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
} 