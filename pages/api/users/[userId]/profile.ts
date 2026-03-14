import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { updateUser, getUserByEmail } from '@/queries/users/userQueries';
import { isAvatarAnimal } from '@/lib/avatar';
import { profilePatchBodySchema } from '@/lib/api-schemas';

export default async function profileHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.query.userId as string;
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email || session.user.email !== userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const user = await getUserByEmail(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.status(200).json({
        name: user.name,
        image: user.image ?? '',
        avatarAnimal: user.avatarAnimal ?? undefined,
        createdAt: user.createdAt ? (user.createdAt as Date).toISOString() : undefined,
        buymeAmount: user.buymeAmount,
        buymeType: user.buymeType,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Failed to load profile' });
    }
  }

  if (req.method === 'PATCH') {
    const parsed = profilePatchBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const first = parsed.error.flatten().formErrors[0];
      return res.status(400).json({ message: typeof first === 'string' ? first : 'No valid fields to update' });
    }
    const update: Record<string, unknown> = {};
    const { name, avatarAnimal, buymeAmount, buymeType } = parsed.data;
    if (name !== undefined) update.name = name;
    if (avatarAnimal !== undefined && (avatarAnimal === '' || isAvatarAnimal(avatarAnimal))) {
      update.avatarAnimal = avatarAnimal;
    }
    if (buymeAmount !== undefined) update.buymeAmount = buymeAmount;
    if (buymeType !== undefined) update.buymeType = buymeType;
    try {
      await updateUser(userId, update as Partial<import('@/types/db').UserDocument>);
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Update failed' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
