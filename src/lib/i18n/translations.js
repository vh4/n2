/**
 * Centralized Internationalization (i18n) Dictionary.
 * Provides bilingual string mappings for English (EN) and Indonesian (ID).
 * Every user-facing UI label, button, filter, and notification is mapped here.
 */

export const translations = {
  // Navigation tabs
  nav_grammar:   { EN: 'Grammar (Bunpou)', ID: 'Grammar (Bunpou)' },
  nav_vocab:     { EN: 'Vocabulary (1,550+ Words)', ID: 'Kosakata N2 (1.550+ Kata)' },
  nav_kanji:     { EN: 'Kanji N2 (380+ Kanji)', ID: 'Kanji N2 (380+ Kanji)' },
  nav_favorites: { EN: 'My Favorites',      ID: 'Favorit Saya' },

  // Sidebar & layout sections
  menu_label:    { EN: 'Learning Menu',     ID: 'Menu Pembelajaran' },
  category_label:{ EN: 'Grammar Category', ID: 'Kategori Bunpou' },
  learning_map:  { EN: 'Learning Map',      ID: 'Learning Map' },
  progress_label:{ EN: 'Study Progress',    ID: 'Progres Belajar' },

  // Progress indicators
  mastered_label:{ EN: 'mastered',          ID: 'dikuasai' },
  review_label:  { EN: 'Review',            ID: 'Ulang' },
  known_label:   { EN: 'Known',             ID: 'Ingat' },
  fav_label:     { EN: 'Favorite',          ID: 'Favorit' },

  // Header badges & branding
  streak_unit:   { EN: 'days',              ID: 'hari' },
  enterprise:    { EN: 'Enterprise',        ID: 'Enterprise' },
  subtitle:      { EN: 'Japanese Mastery Studio', ID: 'Japanese Mastery Studio' },

  // Workspace headers & descriptions
  title_grammar: { EN: 'Grammar N2 (Bunpou)', ID: 'Grammar N2 (Bunpou)' },
  title_vocab:   { EN: 'N2 Vocabulary (1,550+ Words)', ID: 'Kosakata N2 (1.550+ Kata)' },
  title_kanji:   { EN: 'Kanji N2 (380+ Kanji)', ID: 'Kanji N2 (380+ Kanji)' },
  desc_grammar:  { EN: 'Study 235 JLPT N2 grammar patterns with explanations, formulas, example sentences, and audio.', ID: 'Pelajari 235 pola tata bahasa JLPT N2 lengkap dengan penjelasan, rumus, contoh kalimat, dan audio.' },
  desc_vocab:    { EN: '1,550+ N2 core & Mazii vocabulary words with full EN | ID real-time translation & audio.', ID: '1.550+ kosakata N2 & Mazii dengan terjemahan real-time EN | ID dan audio pengucapan.' },
  desc_kanji:    { EN: 'Master 380+ N2 kanji with Onyomi, Kunyomi, definitions, stroke count, and compound word examples.', ID: 'Kuasai 380+ kanji N2 lengkap dengan Onyomi, Kunyomi, jumlah coretan, dan contoh kata majemuk.' },

  // Action buttons
  btn_start:         { EN: 'Start Session →',  ID: 'Mulai Sesi →' },
  btn_shuffle:       { EN: 'Shuffle 🔀',       ID: 'Acak Kartu 🔀' },
  btn_autoplay:      { EN: '▶ Auto Play (Audio)', ID: '▶ Auto Play (Audio)' },
  btn_stop_autoplay: { EN: '⏹ Stop Auto Play',  ID: '⏹ Hentikan Auto Play' },
  btn_flip:          { EN: 'Tap to flip',      ID: 'Ketuk untuk membalik' },

  // Filter Bar Buttons
  filter_all:      { EN: 'All',              ID: 'Semua' },
  filter_unrated:  { EN: 'Unrated',          ID: 'Belum Dinilai' },
  filter_again:    { EN: 'Not Yet',         ID: 'Belum Ingat' },
  filter_mastered: { EN: 'Mastered',       ID: 'Dikuasai' },
  filter_fav:      { EN: '★ Favorites',     ID: '★ Favorit' },
  filter_favorite: { EN: '★ Favorites',    ID: '★ Favorit' },

  // Search input placeholders
  search_grammar:{ EN: 'Search grammar, meaning, example…', ID: 'Cari grammar, arti, contoh…' },
  search_vocab:  { EN: 'Search vocabulary, reading, meaning…', ID: 'Cari kosakata, bacaan, arti…' },
  search_kanji:  { EN: 'Search kanji, Onyomi, Kunyomi, meaning…', ID: 'Cari kanji, Onyomi, Kunyomi, arti…' },

  // Card face badges & labels
  card_label_grammar: { EN: 'Grammar N2', ID: 'Grammar N2' },
  card_label_vocab:   { EN: 'N2 Vocabulary', ID: 'Kosakata N2' },
  card_label_kanji:   { EN: 'Kanji N2', ID: 'Kanji N2' },
  card_not_rated:     { EN: 'Not rated yet', ID: 'Belum dinilai' },
  card_mastered:      { EN: '✓ Mastered',   ID: '✓ Dikuasai' },
  card_again:         { EN: '↻ Review',      ID: '↻ Perlu Ulang' },

  // Card back detail labels
  back_meaning:  { EN: 'Meaning', ID: 'Arti' },
  back_formula:  { EN: 'Formula / Formation', ID: 'Rumus / Formation' },
  back_example:  { EN: 'Example Sentence', ID: 'Contoh Kalimat' },
  back_vocab:    { EN: 'Vocabulary Meaning', ID: 'Arti Kosakata' },
  back_strokes:  { EN: 'strokes', ID: 'coretan' },
  back_compounds:{ EN: 'Compound Word Examples:', ID: 'Contoh Kata Majemuk:' },

  // Bottom rating action buttons
  rate_again:    { EN: '↻ Need Review (1)', ID: '↻ Perlu Ulang (1)' },
  rate_mastered: { EN: '✓ Got It (2)',       ID: '✓ Sudah Ingat (2)' },

  // Toast notifications
  toast_start:          { EN: 'Session started! Good luck!', ID: 'Sesi dimulai! Semangat!' },
  toast_shuffle:        { EN: '🔀 Cards shuffled!', ID: '🔀 Kartu berhasil diacak!' },
  toast_autoplay_start: { EN: '▶ Auto Play started! Playing audio for Japanese & meaning...', ID: '▶ Auto Play dimulai! Memutar audio Bahasa Jepang & arti...' },
  toast_autoplay_end:   { EN: '🎉 Auto Play page completed!', ID: '🎉 Auto Play 1 halaman selesai!' },
  toast_fav_add:        { EN: '★ Added to Favorites', ID: '★ Ditambahkan ke Favorit' },
  toast_fav_rem:        { EN: '☆ Removed from Favorites', ID: '☆ Dihapus dari Favorit' },
  toast_again:          { EN: '↻ Added to review queue', ID: '↻ Masuk antrean ulang' },
  toast_mastered:       { EN: '✓ Marked as Mastered', ID: '✓ Ditandai Dikuasai' },
  toast_lang_id:        { EN: '🇮🇩 Indonesian Language', ID: '🇮🇩 Bahasa Indonesia diaktifkan' },
  toast_lang_en:        { EN: '🇬🇧 English Language Activated', ID: '🇬🇧 English Language Activated' },
  toast_dark:           { EN: 'Dark mode enabled', ID: 'Mode gelap diaktifkan' },
  toast_light:          { EN: 'Light mode enabled', ID: 'Mode terang diaktifkan' },
  toast_session_end:    { EN: 'Session complete 🎉', ID: 'Sesi selesai 🎉' },

  // Catalog table headers
  catalog_grammar:{ EN: 'Grammar Catalog', ID: 'Katalog Bunpou' },
  catalog_vocab:  { EN: 'N2 Vocabulary Catalog', ID: 'Katalog Kosakata N2' },
  catalog_kanji:  { EN: 'Kanji Catalog', ID: 'Katalog Kanji N2' },

  // Counter units
  count_cards:   { EN: 'cards', ID: 'kartu' },
  count_vocab:   { EN: 'vocab', ID: 'kosakata' },
  count_kanji:   { EN: 'kanji', ID: 'kanji' },

  // Empty state message
  empty:         { EN: 'No matching items found.', ID: 'Tidak ada item yang cocok.' },

  // Mobile navigation tabs
  mob_grammar:   { EN: 'Grammar', ID: 'Grammar' },
  mob_vocab:     { EN: 'Vocab',   ID: 'Kosakata' },
  mob_kanji:     { EN: 'Kanji',   ID: 'Kanji' },
  mob_fav:       { EN: 'Saved',   ID: 'Favorit' },
  mob_menu:      { EN: 'Menu',    ID: 'Menu' },

  // Bottom drawer menu
  drawer_title:    { EN: 'Quick Menu', ID: 'Menu Akses Cepat' },
  drawer_subtitle: { EN: 'Control center & learning categories', ID: 'Pusat kontrol & kategori pembelajaran' },
  drawer_theme:    { EN: 'Appearance', ID: 'Tampilan' },
  drawer_language: { EN: 'Language', ID: 'Bahasa' },
  drawer_account:  { EN: 'Account', ID: 'Akun' },
  drawer_close:    { EN: 'Close', ID: 'Tutup' },

  // Kanji information labels
  onyomi:        { EN: 'On\'yomi (Chinese Reading)', ID: 'Onyomi (音読み)' },
  kunyomi:       { EN: 'Kun\'yomi (Japanese Reading)', ID: 'Kunyomi (訓読み)' },
  theme_label:   { EN: 'Theme', ID: 'Tema' },
};
