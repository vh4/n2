/**
 * Utility functions for N2 Japanese Mastery Studio.
 * Provides helper functions for classname concatenation, text cleaning, and formatting.
 */

/**
 * Combines multiple conditional class names into a single clean string.
 * Filters out falsy values (null, undefined, false, empty strings).
 *
 * @param {...(string|boolean|null|undefined)} classes - List of class strings or conditional expressions.
 * @returns {string} Single combined class string with spaces in between.
 *
 * @example
 * cls('px-4 py-2', isActive && 'bg-blue-600', isError ? 'text-red-500' : 'text-slate-700')
 */
export function cls(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Cleans Japanese or translation text before sending it to speech synthesis.
 * Strips HTML tags, tildes (~, ～), and parenthetical kana annotations to ensure
 * smooth, natural, and uninterrupted audio playback.
 *
 * @param {string} text - The raw text containing symbols or annotations.
 * @returns {string} Sanitized plain text suitable for audio speech engines.
 */
export function sanitizeSpeechText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')      // Remove HTML tags if present
    .replace(/[～~]/g, '')        // Remove tildes commonly used in grammar patterns
    .replace(/\([^)]*\)/g, '')    // Remove pronunciation brackets like (ていし)
    .trim();
}

/**
 * Capitalizes the first letter of a given string.
 *
 * @param {string} str - String to capitalize.
 * @returns {string} String with its first character converted to uppercase.
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extracts and formats example sentences from a vocabulary array entry.
 * Supports both 12-element schema (with ex1_en and ex2_en) and legacy formats.
 * Dynamically prioritizes meaning based on active language ('EN' vs 'ID').
 *
 * Schema: ["kanji", "kana", "english", "indonesian", "ex1_jp", "ex1_romaji", "ex1_id", "ex2_jp", "ex2_romaji", "ex2_id", "ex1_en", "ex2_en"]
 *
 * @param {Array<string>} item - The vocabulary array entry.
 * @param {'EN'|'ID'} [lang='ID'] - Active interface language.
 * @returns {Array<{jp: string, ro: string, id: string, en: string, meaning: string, subMeaning: string}>}
 */
export function getVocabExamples(item, lang = 'ID') {
  if (!Array.isArray(item) || item.length < 5) return [];

  const examples = [];
  const is12Element = item.length >= 12;

  // Example 1 (indices 4, 5, 6, [10])
  if (item[4]) {
    const ex1_en = is12Element ? (item[10] || '') : '';
    const ex1_id = item[6] || '';
    examples.push({
      jp: item[4],
      ro: item[5] || '',
      id: ex1_id,
      en: ex1_en,
      meaning: lang === 'EN' && ex1_en ? ex1_en : ex1_id,
      subMeaning: lang === 'EN' ? (ex1_id ? `🇮🇩 ${ex1_id}` : '') : (ex1_en ? `🇬🇧 ${ex1_en}` : '')
    });
  }

  // Example 2 (indices 7, 8, 9, [11])
  if (item[7]) {
    const ex2_en = is12Element ? (item[11] || '') : '';
    const ex2_id = item[9] || '';
    examples.push({
      jp: item[7],
      ro: item[8] || '',
      id: ex2_id,
      en: ex2_en,
      meaning: lang === 'EN' && ex2_en ? ex2_en : ex2_id,
      subMeaning: lang === 'EN' ? (ex2_id ? `🇮🇩 ${ex2_id}` : '') : (ex2_en ? `🇬🇧 ${ex2_en}` : '')
    });
  }

  return examples;
}

