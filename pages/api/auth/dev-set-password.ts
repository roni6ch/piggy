import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { updateUser, getUserByEmail, createUser } from '@/queries/users/userQueries';

const SALT_ROUNDS = 10;

/**
 * Dev-only: create or fix a user so login works. Creates user if missing, otherwise updates password to bcrypt hash.
 * POST { "email": "dev@test.com", "password": "dev123" }
 * Then use: /auth/login?email=dev@test.com&password=dev123
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'email and password required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const existing = await getUserByEmail(normalizedEmail);

  if (existing) {
    await updateUser(normalizedEmail, { password: hashedPassword } as any);
    return res.status(200).json({
      message: `Password updated for ${normalizedEmail}. You can now log in.`,
    });
  }

  const { getDefaultAvatarAnimal } = await import('@/lib/avatar');
  await createUser({
    email: normalizedEmail,
    name: 'Dev User',
    image: '',
    avatarAnimal: getDefaultAvatarAnimal(),
    password: hashedPassword,
    cards: [],
    searches: [],
  } as any);

  return res.status(201).json({
    message: `User ${normalizedEmail} created. You can now log in at /auth/login?email=${encodeURIComponent(normalizedEmail)}&password=...`,
  });
}
