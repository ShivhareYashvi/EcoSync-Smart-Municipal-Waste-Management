import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TextScale = 'sm' | 'base' | 'lg' | 'xl';

export type AccessibilityState = {
  highContrast: boolean;
  textScale: TextScale;
  underlinedLinks: boolean;
  reducedMotion: boolean;
  increasedSpacing: boolean;
  screenReaderAssistance: boolean;

  setHighContrast: (enabled: boolean) => void;
  setTextScale: (scale: TextScale) => void;
  setUnderlinedLinks: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setIncreasedSpacing: (enabled: boolean) => void;
  setScreenReaderAssistance: (enabled: boolean) => void;
  resetToDefaults: () => void;
};

const DEFAULT_STATE = {
  highContrast: false,
  textScale: 'base' as TextScale,
  underlinedLinks: false,
  reducedMotion: false,
  increasedSpacing: false,
  screenReaderAssistance: false,
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setHighContrast: (highContrast) => {
        set({ highContrast });
        syncDomClasses({ highContrast });
      },

      setTextScale: (textScale) => {
        set({ textScale });
        syncDomClasses({ textScale });
      },

      setUnderlinedLinks: (underlinedLinks) => {
        set({ underlinedLinks });
        syncDomClasses({ underlinedLinks });
      },

      setReducedMotion: (reducedMotion) => {
        set({ reducedMotion });
        syncDomClasses({ reducedMotion });
      },

      setIncreasedSpacing: (increasedSpacing) => {
        set({ increasedSpacing });
        syncDomClasses({ increasedSpacing });
      },

      setScreenReaderAssistance: (screenReaderAssistance) => {
        set({ screenReaderAssistance });
      },

      resetToDefaults: () => {
        set(DEFAULT_STATE);
        syncDomClasses(DEFAULT_STATE);
      },
    }),
    {
      name: 'ecosync-accessibility-prefs',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          syncDomClasses(state);
        }
      },
    }
  )
);

/**
 * Synchronize accessibility classes to <html> element
 */
export function syncDomClasses(
  partialState: Partial<Pick<AccessibilityState, 'highContrast' | 'textScale' | 'underlinedLinks' | 'reducedMotion' | 'increasedSpacing'>>
) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (partialState.highContrast !== undefined) {
    root.classList.toggle('high-contrast', partialState.highContrast);
  }

  if (partialState.textScale !== undefined) {
    root.classList.remove('text-scale-sm', 'text-scale-base', 'text-scale-lg', 'text-scale-xl');
    root.classList.add(`text-scale-${partialState.textScale}`);
  }

  if (partialState.underlinedLinks !== undefined) {
    root.classList.toggle('underlined-links', partialState.underlinedLinks);
  }

  if (partialState.reducedMotion !== undefined) {
    root.classList.toggle('reduced-motion', partialState.reducedMotion);
  }

  if (partialState.increasedSpacing !== undefined) {
    root.classList.toggle('increased-spacing', partialState.increasedSpacing);
  }
}

