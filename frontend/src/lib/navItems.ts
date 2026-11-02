export interface EcoNavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export const ECO_NAV_ITEMS: EcoNavItem[] = [
  { label: 'Home', href: '/#home' },
  { label: 'Solutions', href: '/#solutions' },
  { label: 'Operations', href: '/#operations' },
  { label: 'Recycling', href: '/#recycling' },
  { label: 'Scrap', href: '/#scrap' },
  { label: 'About', href: '/#about' },
  { label: 'Blog', href: '/#blog' },
  { label: 'FAQ', href: '/#faq' },
];

