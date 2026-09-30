import { prisma } from './prisma.js';

/** Temporary local workspace identity. Replace with real auth when accounts are added. */
export async function getDemoUser() {
  return prisma.user.upsert({
    where: { clerkId: 'local-demo-user' },
    update: {},
    create: {
      clerkId: 'local-demo-user',
      email: 'demo@local.invalid',
      name: 'Local creator',
    },
  });
}
