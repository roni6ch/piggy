import 'next-auth';

declare module 'next-auth' {
  interface User {
    avatarAnimal?: string;
  }

  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatarAnimal?: string;
    };
  }
}
