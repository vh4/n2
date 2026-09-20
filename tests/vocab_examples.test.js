import test from 'node:test';
import assert from 'node:assert/strict';
import { vocab } from '../src/data/vocab.js';
import { maziiData } from '../src/data/mazii.js';

test('1. Vocab Data Contract — Exported vocab has 1,550+ entries and all have at least 2 complete example sentences', () => {
  assert.ok(vocab.length >= 1550, `Expected at least 1550 vocab entries, got ${vocab.length}`);

  for (let i = 0; i < vocab.length; i++) {
    const item = vocab[i];
    assert.ok(Array.isArray(item), `Item ${i} must be an array`);
    assert.ok(item.length >= 10, `Item ${i} (${item[0]}) must have at least 10 elements (got ${item.length})`);

    // Field checks
    assert.ok(item[0] && typeof item[0] === 'string', `Item ${i}: kanji must be non-empty string`);
    assert.ok(typeof item[1] === 'string', `Item ${i}: reading must be string`);
    assert.ok(item[2] && typeof item[2] === 'string', `Item ${i}: English must be non-empty string`);
    assert.ok(item[3] && typeof item[3] === 'string', `Item ${i}: Indonesian must be non-empty string`);

    // Example 1 checks
    assert.ok(item[4] && typeof item[4] === 'string', `Item ${i} (${item[0]}): example 1 JP must be non-empty`);
    assert.ok(item[5] && typeof item[5] === 'string', `Item ${i} (${item[0]}): example 1 Romaji must be non-empty`);
    assert.ok(item[6] && typeof item[6] === 'string', `Item ${i} (${item[0]}): example 1 ID must be non-empty`);

    // Example 2 checks (At least 2 examples required)
    assert.ok(item[7] && typeof item[7] === 'string', `Item ${i} (${item[0]}): example 2 JP must be non-empty`);
    assert.ok(item[8] && typeof item[8] === 'string', `Item ${i} (${item[0]}): example 2 Romaji must be non-empty`);
    assert.ok(item[9] && typeof item[9] === 'string', `Item ${i} (${item[0]}): example 2 ID must be non-empty`);
  }
});

test('2. Mazii Data Contract — All 1,550 items in maziiData have at least 2 example sentences', () => {
  assert.equal(maziiData.length, 1550, `Expected exactly 1550 mazii items, got ${maziiData.length}`);

  for (let i = 0; i < maziiData.length; i++) {
    const m = maziiData[i];
    assert.ok(m.length >= 10, `Mazii item ${i} (${m[0]}) must have at least 10 elements`);
    assert.ok(m[4] && m[5] && m[6], `Mazii item ${i} (${m[0]}) must have complete Example 1`);
    assert.ok(m[7] && m[8] && m[9], `Mazii item ${i} (${m[0]}) must have complete Example 2`);
  }
});

test('3. Specific Requirement Regression — 停止 has at least 2 authentic JLPT N2 examples', () => {
  const teishi = vocab.find(v => v[0] === '停止');
  assert.ok(teishi, '停止 must be present in vocab');
  assert.ok(teishi.length >= 10, '停止 must have at least 10 elements');

  // Example 1
  assert.equal(teishi[4], '列車は一時停止した。');
  assert.equal(teishi[5], 'Ressha wa ichiji teishi shita.');
  assert.equal(teishi[6], 'Kereta berhenti sementara.');

  // Example 2
  assert.equal(teishi[7], '強風のため、電車の運行が一時停止された。');
  assert.equal(teishi[8], 'Kyōfū no tame, densha no unkō ga ichiji teishi sareta.');
  assert.equal(teishi[9], 'Operasional kereta dihentikan sementara karena angin kencang.');
});
