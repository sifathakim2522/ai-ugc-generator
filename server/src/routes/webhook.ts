import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { Webhook } from 'svix';

const router = Router();

// Clerk webhook secret from environment
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/clerk
 * 
 * Receives webhook events from Clerk to sync user data with Prisma.
 * Uses svix to verify the webhook signature for security.
 * 
 * Events handled:
 * - user.created: Creates a new Prisma user
 * - user.updated: Updates the existing Prisma user
 * - user.deleted: Removes the Prisma user
 */
router.post('/webhooks/clerk', async (req, res) => {
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  // Get the svix headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({ error: 'Missing svix headers' });
    return;
  }

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(
      JSON.stringify(req.body),
      {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }
    );
  } catch (err) {
    console.error('Webhook verification failed:', err);
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  const eventType = evt.type;
  const data = evt.data;

  try {
    switch (eventType) {
      case 'user.created': {
        const email = data.email_addresses?.[0]?.email_address ?? '';
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
        const image = data.image_url ?? null;

        await prisma.user.upsert({
          where: { clerkId: data.id },
          update: { email, name, image },
          create: {
            clerkId: data.id,
            email,
            name,
            image,
          },
        });
        console.log(`User created/synced: ${data.id}`);
        break;
      }

      case 'user.updated': {
        const email = data.email_addresses?.[0]?.email_address ?? '';
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;
        const image = data.image_url ?? null;

        await prisma.user.upsert({
          where: { clerkId: data.id },
          update: { email, name, image },
          create: {
            clerkId: data.id,
            email,
            name,
            image,
          },
        });
        console.log(`User updated: ${data.id}`);
        break;
      }

      case 'user.deleted': {
        if (data.id) {
          await prisma.user.delete({ where: { clerkId: data.id } });
          console.log(`User deleted: ${data.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Error processing ${eventType}:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
