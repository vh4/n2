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
