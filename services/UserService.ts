import { getDefaultAvatarAnimal } from '@/lib/avatar';
import { createUser, getUserByEmail } from '@/queries/users/userQueries';

export interface User {
  name: string;
  email: string;
  picture: string;
  userRole: string;
}

export class UserService {
  public static async createUserIfNotExists(connectedUser: User): Promise<any> {
    try {
      if (!connectedUser.name || !connectedUser.email) {
        throw new Error('Invalid connectedUser: name, email are required');
      }

      const user = await getUserByEmail(connectedUser.email);

      if (!user) {
        const newUser: any = {
          name: connectedUser.name,
          email: connectedUser.email,
          image: connectedUser.picture || '',
          avatarAnimal: connectedUser.picture ? undefined : getDefaultAvatarAnimal(),
        };

        await createUser(newUser);
        return getUserByEmail(connectedUser.email);
      }
      return user;
    } catch (error) {
      console.error(`Error creating or retrieving user: ${error}`);
      throw error;
    }
  }
}
