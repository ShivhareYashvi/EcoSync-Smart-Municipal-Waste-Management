import enGuideData from './locales/en.json';

export interface GuideCategory {
  id: string;
  name: string;
  binColor: string;
  colorCode: string;
  bgLight: string;
  description: string;
  acceptedItems: string[];
  prohibitedItems: string[];
  instructions: string[];
}

export interface GuideContent {
  guideTitle: string;
  guideSubtitle: string;
  searchPlaceholder: string;
  categories: GuideCategory[];
  dos: string[];
  donts: string[];
}

// Registry of supported locales with automatic English fallback
const localeRegistry: Record<string, GuideContent> = {
  en: enGuideData as GuideContent,
};

/**
 * Resolve guide content for the given locale preference.
 * Falls back cleanly to English ('en') if an unsupported or unknown locale is requested.
 */
export function getGuideContent(locale?: string | null): GuideContent {
  const normalized = (locale || 'en').toLowerCase().trim();
  if (localeRegistry[normalized]) {
    return localeRegistry[normalized];
  }
  // Try language prefix (e.g., 'en-US' -> 'en')
  const prefix = normalized.split('-')[0];
  if (localeRegistry[prefix]) {
    return localeRegistry[prefix];
  }
  return localeRegistry['en'];
}

/**
 * Register a new language pack at runtime or extension
 */
export function registerGuideLocale(localeCode: string, content: GuideContent): void {
  localeRegistry[localeCode.toLowerCase().trim()] = content;
}
