import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { getDefaultAvatarAnimal } from '@/lib/avatar';
import { createUser, getUserByEmail } from '@/queries/users/userQueries';
import { registerBodySchema } from '@/lib/api-schemas';

const SALT_ROUNDS = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const parsed = registerBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const first = parsed.error.flatten().formErrors[0];
    return res.status(400).json({ message: typeof first === 'string' ? first : 'Invalid input' });
  }

  const { username, email, password } = parsed.data;
  const existing = await getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await createUser({
    name: username,
    email,
    image: '',
    avatarAnimal: getDefaultAvatarAnimal(),
    password: hashedPassword,
  } as any);

  return res.status(201).json({ message: 'Registered successfully' });
}
