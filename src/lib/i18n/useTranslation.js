import { useMemo } from 'react';
import { translations } from './translations';

/**
 * Custom React hook for internationalization (i18n).
 * Provides a simple `tr(key)` function to translate UI strings based on the active language.
 *
 * @param {'EN'|'ID'} lang - The currently selected language code ('EN' for English, 'ID' for Indonesian).
 * @returns {(key: string) => string} A memoized translation function that looks up strings in the dictionary.
 *
 * @example
 * const tr = useTranslation(lang);
 * return <button>{tr('btn_flip')}</button>;
 */
export function useTranslation(lang = 'EN') {
  return useMemo(() => {
    return function tr(key) {
      const entry = translations[key];
      if (!entry) return key; // Fallback to raw key if translation key is missing
      return entry[lang] || entry['EN'] || key;
    };
  }, [lang]);
}

// Named alias for convenience across components
export const useT = useTranslation;
