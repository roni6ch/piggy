import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

/**
 * Ensures the request has a valid session and that userId (from URL) matches the session user's email.
 * Use on all user-scoped API routes (e.g. /api/users/[userId]/...).
 * Returns session and normalized email on success; sends 403 and returns null otherwise.
 */
export async function requireUserSession(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
): Promise<{ email: string } | null> {
  const session = await getServerSession(req, res, authOptions);
  const normalizedUserId = userId?.trim().toLowerCase();
  if (!session?.user?.email || session.user.email.toLowerCase() !== normalizedUserId) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  return { email: session.user.email.trim().toLowerCase() };
}
