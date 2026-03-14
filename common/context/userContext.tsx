import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { Card, Business, UserFilters } from '../types';
import type { UserCoupon } from '../api';

export type ProfileData = {
  name: string;
  image: string | null;
  createdAt: string | null;
  avatarAnimal: string;
  location?: string | null;
};

/** All fetched user data lives here. Only initial fetch or explicit mutations update it (no refetch on route change). */
export type IUserData = {
  cards: Card[];
  coupons?: UserCoupon[];
  cardsLoading?: boolean;
  couponsLoading?: boolean;
  recentSearches?: Business[];
  recentSearchesLoading?: boolean;
  /** True after first successful fetch; prevents refetch on navigation. */
  userDataFetched?: boolean;
  profileData?: ProfileData | null;
  profileDataEmail?: string | null;
  credits?: {};
  settings?: {};
  filters?: UserFilters;
};

export type IUserContext = {
  userData: IUserData;
  setUserData: Dispatch<SetStateAction<IUserData>>;
};

const UserContext = createContext<IUserContext>({
  userData: {
    cards: [],
    coupons: [],
  },
  setUserData: () => {},
});

export function UserDataProvider({
  children,
}: {
  children: React.ReactElement;
}) {
  const [userData, setUserData] = useState<IUserData>({
    cards: [],
    coupons: [],
    filters: {},
  });

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
}
export const useUserDataContext = () => useContext(UserContext);
