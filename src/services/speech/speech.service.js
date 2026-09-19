import { sanitizeSpeechText } from '../../lib/utils';

/**
 * Speech Synthesis Service for N2 Japanese Mastery Studio.
 * Handles high-quality text-to-speech audio pronunciation across Japanese (ja-JP),
 * Indonesian (id-ID), and English (en-US) using the Web Speech API.
 */

/**
 * Selects the optimal native system voice for a given language code.
 * Prioritizes high-definition and natural-sounding voices (Siri, Google, Kyoko, Damayanti).
 *
 * @param {string} langCode - Language identifier code ('ja-JP', 'id-ID', 'en-US').
 * @returns {SpeechSynthesisVoice|null} The best matching voice or null if not available.
 */
export function getBestVoice(langCode) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const prefix = langCode.slice(0, 2).toLowerCase(); // 'ja', 'id', 'en'

  // Match voices belonging to the requested language prefix
  const langVoices = voices.filter(v => (v.lang || '').toLowerCase().startsWith(prefix));
  if (langVoices.length === 0) return null;

  // Language-specific voice quality heuristics:
  if (prefix === 'ja') {
    // Prefer Kyoko, Otoya, Hattori, or Google 日本語
    const preferred = langVoices.find(v => /kyoko|otoya|hattori|google/i.test(v.name));
    if (preferred) return preferred;
  } else if (prefix === 'id') {
    // Prefer Damayanti or Google Bahasa Indonesia
    const preferred = langVoices.find(v => /damayanti|indonesia|google/i.test(v.name));
    if (preferred) return preferred;
  } else if (prefix === 'en') {
    // Prefer Samantha, Daniel, Karen, or Google US English
    const preferred = langVoices.find(v => /samantha|daniel|karen|google/i.test(v.name));
    if (preferred) return preferred;
  }

  // Fallback to default voice in that language or first available
  return langVoices.find(v => v.default) || langVoices[0];
}

/**
 * Speaks a given Japanese text aloud using the device's native Japanese voice.
 * Cleans the input text by stripping HTML tags, tildes, and kana brackets.
 *
 * @param {string} text - Japanese word, sentence, or grammar pattern to speak.
 * @returns {void}
 */
export function speakJapanese(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;

  window.speechSynthesis.cancel(); // Cancel any ongoing speech to avoid overlaps

  const clean = sanitizeSpeechText(text);
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.88; // Slightly relaxed pace optimal for language learning
  utterance.pitch = 1.0;

  const voice = getBestVoice('ja-JP');
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

/**
 * Speaks text asynchronously with a Promise that resolves when audio playback completes.
 * Essential for the sequential Auto Play loop (Front Card -> Back Card -> Next Card).
 *
 * @param {string} text - Text to speak aloud.
 * @param {string} langCode - Language code ('ja-JP', 'id-ID', 'en-US'). Default is 'ja-JP'.
 * @returns {Promise<void>} Resolves when speech finishes or times out safely.
 */
export function speakAsync(text, langCode = 'ja-JP') {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
      setTimeout(resolve, 600);
      return;
    }

    window.speechSynthesis.cancel();

    const clean = sanitizeSpeechText(text);
    if (!clean) {
      setTimeout(resolve, 400);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langCode;
    utterance.rate = 0.84; // Clear, measured pace
    utterance.pitch = 1.0;

    const voice = getBestVoice(langCode);
    if (voice) utterance.voice = voice;

    let isResolved = false;
    const finish = () => {
      if (!isResolved) {
        isResolved = true;
        resolve();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    setTimeout(finish, 8000); // 8-second safety timeout fallback

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stops any ongoing audio speech synthesis immediately.
 * Called when flipping cards manually, navigating away, or clicking Stop Auto Play.
 *
 * @returns {void}
 */
export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
