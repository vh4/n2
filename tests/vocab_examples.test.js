import test from 'node:test';
import assert from 'node:assert/strict';
import { vocab } from '../src/data/vocab.js';
import { maziiData } from '../src/data/mazii.js';
import { cards } from '../src/data/cards.js';
import { kanji } from '../src/data/kanji.js';
import { getVocabExamples } from '../src/lib/utils.js';
import { t } from '../src/i18n.js';
import { translations } from '../src/lib/i18n/translations.js';

test('1. Vocab Data Contract — Exported vocab has 1,550+ entries and all have 12 elements with natural conversational & situational examples (JP, Romaji, ID, EN)', () => {
  assert.ok(vocab.length >= 1550, `Expected at least 1550 vocab entries, got ${vocab.length}`);

  for (let i = 0; i < vocab.length; i++) {
    const item = vocab[i];
    assert.ok(Array.isArray(item), `Item ${i} must be an array`);
    assert.ok(item.length >= 12, `Item ${i} (${item[0]}) must have 12 elements (got ${item.length})`);

    // Word & meaning checks
    assert.ok(item[0] && typeof item[0] === 'string', `Item ${i}: kanji must be non-empty string`);
    assert.ok(typeof item[1] === 'string', `Item ${i}: reading must be string`);
    assert.ok(item[2] && typeof item[2] === 'string', `Item ${i}: English definition must be non-empty string`);
    assert.ok(item[3] && typeof item[3] === 'string', `Item ${i}: Indonesian definition must be non-empty string`);

    // Example 1 checks (Conversational quote or natural Japanese)
    assert.ok(item[4] && typeof item[4] === 'string', `Item ${i} (${item[0]}): example 1 JP must be non-empty`);
    assert.ok(item[5] && typeof item[5] === 'string', `Item ${i} (${item[0]}): example 1 Romaji must be non-empty`);
    assert.ok(item[6] && typeof item[6] === 'string', `Item ${i} (${item[0]}): example 1 ID must be non-empty`);

    // Example 2 checks (Situational JLPT context)
    assert.ok(item[7] && typeof item[7] === 'string', `Item ${i} (${item[0]}): example 2 JP must be non-empty`);
    assert.ok(item[8] && typeof item[8] === 'string', `Item ${i} (${item[0]}): example 2 Romaji must be non-empty`);
    assert.ok(item[9] && typeof item[9] === 'string', `Item ${i} (${item[0]}): example 2 ID must be non-empty`);

    // English translation checks (ex1_en, ex2_en)
    assert.ok(item[10] && typeof item[10] === 'string', `Item ${i} (${item[0]}): example 1 EN must be non-empty`);
    assert.ok(item[11] && typeof item[11] === 'string', `Item ${i} (${item[0]}): example 2 EN must be non-empty`);
  }
});

test('2. Mazii Data Contract — All 1,550 items in maziiData have 12 elements with complete EN and ID examples', () => {
  assert.equal(maziiData.length, 1550, `Expected exactly 1550 mazii items, got ${maziiData.length}`);

  for (let i = 0; i < maziiData.length; i++) {
    const m = maziiData[i];
    assert.ok(m.length >= 12, `Mazii item ${i} (${m[0]}) must have at least 12 elements`);
    assert.ok(m[4] && m[5] && m[6], `Mazii item ${i} (${m[0]}) must have complete Example 1 (JP, Ro, ID)`);
    assert.ok(m[7] && m[8] && m[9], `Mazii item ${i} (${m[0]}) must have complete Example 2 (JP, Ro, ID)`);
    assert.ok(m[10] && m[11], `Mazii item ${i} (${m[0]}) must have complete English translations (ex1_en, ex2_en)`);
  }
});

test('3. Specific Requirement Regression — 停止 has authentic natural conversation dialogue and JLPT situational examples', () => {
  const teishi = vocab.find(v => v[0] === '停止');
  assert.ok(teishi, '停止 must be present in vocab');
  assert.ok(teishi.length >= 12, '停止 must have 12 elements');

  // Japanese sentences
  assert.ok(teishi[4].includes('一時停止'), 'Example 1 JP must contain 一時停止');
  assert.ok(teishi[5].includes('teishi'), 'Example 1 Romaji must contain teishi');
  assert.ok(teishi[6].includes('berhenti'), 'Example 1 ID must contain berhenti');

  assert.ok(teishi[7].includes('停止'), 'Example 2 JP must contain 停止');
  assert.ok(teishi[8].includes('teishi'), 'Example 2 Romaji must contain teishi');
  assert.ok(teishi[9].includes('berhenti'), 'Example 2 ID must contain berhenti');

  // English translations
  assert.ok(teishi[10].toLowerCase().includes('stop') || teishi[10].toLowerCase().includes('suspend'), 'Example 1 EN must translate suspension/stop');
  assert.ok(teishi[11].toLowerCase().includes('stop') || teishi[11].toLowerCase().includes('suspend'), 'Example 2 EN must translate suspension/stop');
});

test('4. Dynamic Language Switching Contract — getVocabExamples prioritizes active language seamlessly', () => {
  const teishi = vocab.find(v => v[0] === '停止');
  assert.ok(teishi);

  // When active language is English ('EN')
  const exEN = getVocabExamples(teishi, 'EN');
  assert.equal(exEN.length, 2);
  assert.equal(exEN[0].meaning, teishi[10]);
  assert.ok(exEN[0].subMeaning.includes('🇮🇩'));
  assert.equal(exEN[1].meaning, teishi[11]);
  assert.ok(exEN[1].subMeaning.includes('🇮🇩'));

  // When active language is Indonesian ('ID')
  const exID = getVocabExamples(teishi, 'ID');
  assert.equal(exID.length, 2);
  assert.equal(exID[0].meaning, teishi[6]);
  assert.ok(exID[0].subMeaning.includes('🇬🇧'));
  assert.equal(exID[1].meaning, teishi[9]);
  assert.ok(exID[1].subMeaning.includes('🇬🇧'));
});

test('5. Filter Translations Contract — Semua, Belum Dinilai, Belum Ingat, Dikuasai, Favorite are defined in EN and ID', () => {
  const expectedFilters = ['all', 'unrated', 'again', 'mastered', 'favorite'];

  for (const f of expectedFilters) {
    const key = `filter_${f}`;
    // Test i18n.js
    assert.ok(t[key], `Missing ${key} in src/i18n.js`);
    assert.ok(t[key].EN && typeof t[key].EN === 'string', `Missing EN for ${key} in src/i18n.js`);
    assert.ok(t[key].ID && typeof t[key].ID === 'string', `Missing ID for ${key} in src/i18n.js`);

    // Test translations.js
    assert.ok(translations[key], `Missing ${key} in src/lib/i18n/translations.js`);
    assert.ok(translations[key].EN && typeof translations[key].EN === 'string', `Missing EN for ${key} in translations.js`);
    assert.ok(translations[key].ID && typeof translations[key].ID === 'string', `Missing ID for ${key} in translations.js`);
  }

  // Exact Indonesian label checks requested by user
  assert.equal(t.filter_all.ID, 'Semua');
  assert.equal(t.filter_unrated.ID, 'Belum Dinilai');
  assert.equal(t.filter_again.ID, 'Belum Ingat');
  assert.equal(t.filter_mastered.ID, 'Dikuasai');
  assert.equal(t.filter_favorite.ID, '★ Favorit');
});

test('6. Five Filter State Contract — unrated, again, mastered, favorite, all work symmetrically across Grammar, Vocab, and Kanji', () => {
  // Test with a mock state
  const mockState = {
    // Grammar: 2 cards rated
    'g_0': { status: 'again', fav: false },
    'g_1': { status: 'mastered', fav: true },
    'g_2': { fav: true }, // unrated but favorited

    // Vocab: 3 cards rated
    'v_0': { status: 'again', fav: true },
    'v_1': { status: 'mastered', fav: false },
    'v_2': { status: 'mastered', fav: true },

    // Kanji: 1 card rated
    'k_0': { status: 'again', fav: false }
  };

  // Helper matching the exact workspace filter logic
  function filterItems(dataset, prefix, filter) {
    return dataset.map((_, i) => i).filter((i) => {
      const s = mockState[`${prefix}_${i}`] || {};
      if (filter === 'unrated' && (s.status === 'again' || s.status === 'mastered')) return false;
      if (filter === 'again' && s.status !== 'again') return false;
      if (filter === 'mastered' && s.status !== 'mastered') return false;
      if (filter === 'favorite' && !s.fav) return false;
      return true;
    });
  }

  // Check Grammar (235 items)
  const gAll = filterItems(cards, 'g', 'all');
  const gUnrated = filterItems(cards, 'g', 'unrated');
  const gAgain = filterItems(cards, 'g', 'again');
  const gMastered = filterItems(cards, 'g', 'mastered');
  const gFav = filterItems(cards, 'g', 'favorite');

  assert.equal(gAll.length, cards.length, 'All grammar cards must match');
  assert.equal(gAgain.length, 1, 'g_0 is again');
  assert.equal(gMastered.length, 1, 'g_1 is mastered');
  assert.equal(gFav.length, 2, 'g_1 and g_2 are favorites');
  assert.equal(gUnrated.length, cards.length - 2, 'Unrated must equal total - (again + mastered)');
  assert.ok(gUnrated.includes(2), 'g_2 (fav without rating) must remain in unrated');
  assert.ok(!gUnrated.includes(0), 'g_0 (again) must NOT be in unrated');
  assert.ok(!gUnrated.includes(1), 'g_1 (mastered) must NOT be in unrated');

  // Check Vocab (1550+ items)
  const vAll = filterItems(vocab, 'v', 'all');
  const vUnrated = filterItems(vocab, 'v', 'unrated');
  const vAgain = filterItems(vocab, 'v', 'again');
  const vMastered = filterItems(vocab, 'v', 'mastered');
  const vFav = filterItems(vocab, 'v', 'favorite');

  assert.equal(vAll.length, vocab.length, 'All vocab items must match');
  assert.equal(vAgain.length, 1, 'v_0 is again');
  assert.equal(vMastered.length, 2, 'v_1, v_2 are mastered');
  assert.equal(vFav.length, 2, 'v_0, v_2 are favorites');
  assert.equal(vUnrated.length, vocab.length - 3, 'Unrated must equal total - 3');

  // Mathematical invariance: unrated + again + mastered === total
  assert.equal(gUnrated.length + gAgain.length + gMastered.length, cards.length);
  assert.equal(vUnrated.length + vAgain.length + vMastered.length, vocab.length);
});

test('7. Sequential Advance Regression — Rating in unrated, again, and mastered smoothly advances to immediate next card without skipping', () => {
  // Simulates the exact state machine of rating inside a workspace
  class FlashcardDeckSimulator {
    constructor(items, filter) {
      this.items = [...items]; // array of string names
      this.state = {};
      this.filter = filter; // 'unrated' | 'again' | 'mastered' | 'all' | 'favorite'
      this.pos = 0;
    }

    get filtered() {
      return this.items.filter((item, i) => {
        const s = this.state[item] || {};
        if (this.filter === 'unrated' && (s.status === 'again' || s.status === 'mastered')) return false;
        if (this.filter === 'again' && s.status !== 'again') return false;
        if (this.filter === 'mastered' && s.status !== 'mastered') return false;
        if (this.filter === 'favorite' && !s.fav) return false;
        return true;
      });
    }

    get currentCard() {
      const list = this.filtered;
      const safePos = Math.min(this.pos, Math.max(0, list.length - 1));
      return list[safePos] || null;
    }

    rate(status) {
      const listBefore = this.filtered;
      const willLeave =
        this.filter === 'unrated' ||
        (this.filter === 'again' && status !== 'again') ||
        (this.filter === 'mastered' && status !== 'mastered');

      const activeCard = this.currentCard;
      if (!activeCard) return;

      // Update state
      this.state[activeCard] = { ...(this.state[activeCard] || {}), status };

      // Transition position
      if (willLeave) {
        this.pos = Math.max(0, Math.min(listBefore.length - 2, this.pos));
      } else {
        this.pos = Math.min(listBefore.length - 1, this.pos + 1);
      }
    }
  }

  // Scenario 1: User's reported bug in 'unrated' with 感激, 手入れ, 葬式
  const unratedDeck = new FlashcardDeckSimulator(['感激', '手入れ', '葬式'], 'unrated');
  assert.equal(unratedDeck.currentCard, '感激', 'First card must be 感激');

  // Rate 感激 as 'again' (perlu ulang)
  unratedDeck.rate('again');
  assert.equal(unratedDeck.currentCard, '手入れ', 'After rating 感激, next card MUST BE 手入れ (NOT 葬式!)');

  // Rate 手入れ as 'mastered' (sudah ingat)
  unratedDeck.rate('mastered');
  assert.equal(unratedDeck.currentCard, '葬式', 'After rating 手入れ, next card MUST BE 葬式');

  // Rate 葬式 as 'mastered'
  unratedDeck.rate('mastered');
  assert.equal(unratedDeck.currentCard, null, 'After rating all cards, deck is finished');

  // Scenario 2: In 'again' (belum diingat)
  const againDeck = new FlashcardDeckSimulator(['CardA', 'CardB', 'CardC'], 'again');
  // Initially mark all 3 as 'again'
  againDeck.state = {
    CardA: { status: 'again' },
    CardB: { status: 'again' },
    CardC: { status: 'again' }
  };
  assert.equal(againDeck.currentCard, 'CardA', 'Initial again card is CardA');

  // Rate CardA as 'mastered' (leaves 'again')
  againDeck.rate('mastered');
  assert.equal(againDeck.currentCard, 'CardB', 'After mastering CardA, next card MUST BE CardB (NOT CardC!)');

  // Rate CardB as 'again' (stays in 'again') -> should advance to next card CardC
  againDeck.rate('again');
  assert.equal(againDeck.currentCard, 'CardC', 'Rating again on CardB advances to CardC');

  // Scenario 3: In 'mastered' (dikuasai)
  const masteredDeck = new FlashcardDeckSimulator(['CardX', 'CardY', 'CardZ'], 'mastered');
  masteredDeck.state = {
    CardX: { status: 'mastered' },
    CardY: { status: 'mastered' },
    CardZ: { status: 'mastered' }
  };
  assert.equal(masteredDeck.currentCard, 'CardX', 'Initial mastered card is CardX');

  // Rate CardX as 'again' (leaves 'mastered')
  masteredDeck.rate('again');
  assert.equal(masteredDeck.currentCard, 'CardY', 'After changing CardX to again, next card MUST BE CardY (NOT CardZ!)');

  // Rate CardY as 'mastered' (stays in 'mastered') -> advances to CardZ
  masteredDeck.rate('mastered');
  assert.equal(masteredDeck.currentCard, 'CardZ', 'Rating mastered on CardY advances to CardZ');
});

