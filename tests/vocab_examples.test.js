import test from 'node:test';
import assert from 'node:assert/strict';
import { vocab } from '../src/data/vocab.js';
import { maziiData } from '../src/data/mazii.js';
import { getVocabExamples } from '../src/lib/utils.js';

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
