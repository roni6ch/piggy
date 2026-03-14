import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserByEmailWithPassword } from '@/queries/users/userQueries';

/**
 * Dev-only: check if a user exists and if password is a bcrypt hash.
 * GET /api/auth/dev-check-user?email=dev@test.com
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  if (!email) {
    return res.status(400).json({
      message: 'Add ?email=dev@test.com',
      hint: 'User is looked up by document ID = email (lowercase) in the "users" collection.',
    });
  }

  const user = await getUserByEmailWithPassword(email);
  if (!user) {
    return res.status(200).json({
      found: false,
      message: `No user with document ID "${email}" in users collection.`,
      fix: 'Create a document with ID exactly "' + email + '" in Firestore collection "users", then POST to /api/auth/dev-set-password with that email and your desired password.',
    });
  }

  const hasPassword = !!user.password;
  const looksLikeBcrypt =
    typeof user.password === 'string' &&
    (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

  return res.status(200).json({
    found: true,
    email: user.email,
    hasPassword,
    passwordIsBcryptHash: looksLikeBcrypt,
    message: looksLikeBcrypt
      ? 'User and password look OK. Try logging in.'
      : 'User exists but password is not a bcrypt hash. Run: curl -X POST http://localhost:3000/api/auth/dev-set-password -H "Content-Type: application/json" -d \'{"email":"' +
        email +
        '","password":"yourpassword"}\'',
  });
}
