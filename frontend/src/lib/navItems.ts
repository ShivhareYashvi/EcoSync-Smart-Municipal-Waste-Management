export interface EcoNavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export const ECO_NAV_ITEMS: EcoNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Operations', href: '/operations' },
  { label: 'Scrap Rates', href: '/rates' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
];
