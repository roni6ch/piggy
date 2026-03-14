import {
  NavItem,
  PageName,
  ProfilePageName,
  Routes,
  UserNavItem,
} from './types';

export const navigation: NavItem[] = [
  { name: PageName.HOME, href: Routes.HOME },
  { name: PageName.CATEGORIES, href: Routes.CATEGORIES },
  { name: PageName.CARDS, href: Routes.CARDS },
  { name: PageName.Credits, href: Routes.CREDITS },
];

export const userNavigation: UserNavItem[] = [
  { name: ProfilePageName.PROFILE, href: Routes.PROFILE },
  { name: ProfilePageName.SIGN_OUT, href: Routes.LOGIN },
];
