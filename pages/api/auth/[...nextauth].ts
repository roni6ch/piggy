import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { UserService } from '../../../services/UserService';
import { User } from '../../../services/UserService';
import { getAvatarUrl } from '@/lib/avatar';
import { getUserByEmail, getUserByEmailWithPassword, updateUser } from '@/queries/users/userQueries';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await getUserByEmailWithPassword(email);
        if (!user?.password) return null;

        const stored = user.password;
        const isBcrypt = typeof stored === 'string' && (stored.startsWith('$2a$') || stored.startsWith('$2b$'));
        let ok = false;
        if (isBcrypt) {
          ok = await bcrypt.compare(credentials.password, stored);
        } else if (process.env.NODE_ENV === 'development') {
          // Dev only: allow plain-text password when stored value is not a bcrypt hash (e.g. manually added in Firebase)
          ok = stored === credentials.password;
        }
        if (!ok) return null;
        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          image: user.image || '',
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.JWT_SECRET,
  theme: {
    colorScheme: 'light',
  },
  callbacks: {
    async jwt({ token }: { token: any }) {
      token.userRole = 'admin';

      const connectedUser: User = {
        name: token.name,
        email: token.email,
        picture: token.picture,
        userRole: token.userRole,
      };

      try {
        await UserService.createUserIfNotExists(connectedUser);
        const dbUser = token.email ? await getUserByEmail(token.email) : null;
        if (dbUser) {
          token.name = dbUser.name;
          // Persist Google/OAuth picture if we have one and DB has none or we want to refresh
          const oauthPicture = token.picture as string | undefined;
          if (oauthPicture?.trim() && (!dbUser.image?.trim() || oauthPicture !== dbUser.image)) {
            await updateUser(token.email, { image: oauthPicture });
            token.image = oauthPicture;
          } else {
            token.image = getAvatarUrl(dbUser.image, dbUser.avatarAnimal);
          }
          token.avatarAnimal = dbUser.avatarAnimal ?? undefined;
        }
      } catch (error) {
        console.error(`Error creating or retrieving user: ${error}`);
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.image ?? session.user.image;
        session.user.avatarAnimal = token.avatarAnimal;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
