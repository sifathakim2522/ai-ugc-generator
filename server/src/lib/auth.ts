import { getAuth, clerkClient } from '@clerk/express';
import { prisma } from './prisma.js';
import type { Request } from 'express';

export interface AuthUser {
  clerkId: string;
  prismaUser: {
    id: string;
    clerkId: string;
    email: string;
    name: string | null;
    image: string | null;
    credits: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Get the current authenticated user from a request.
 * Requires clerkMiddleware() to be applied first.
 */
export async function getCurrentUser(request: Request): Promise<AuthUser> {
  const { userId } = getAuth(request);

  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }

  // Upsert Prisma user from Clerk data
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? '';
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;
  const image = clerkUser.imageUrl ?? null;

  const prismaUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, name, image },
    create: { clerkId: userId, email, name, image },
  });

  return { clerkId: userId, prismaUser };
}
