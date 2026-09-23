#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compile all 31 verified natural vocabulary chunks into:
1. src/data/mazii.js (all 1,550 items)
2. src/data/vocab.js (coreVocab 6 items + combined export)
"""

import json
import os

def main():
    all_entries = []
    for i in range(31):
        path = f'scripts/chunks/output_chunk_{i:02d}.json'
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        all_entries.extend(data)

    print(f"Loaded {len(all_entries)} entries from 31 chunks.")
    assert len(all_entries) == 1550, f"Expected 1550 entries, got {len(all_entries)}"

    # Verification
    for i, item in enumerate(all_entries):
        assert len(item) == 12, f"Item {i} ({item[0]}) does not have 12 elements"
        for j, s in enumerate(item):
            assert isinstance(s, str) and s.strip() != '', f"Item {i} ({item[0]}) field {j} is empty"

    # 1. Write src/data/mazii.js
    mazii_path = 'src/data/mazii.js'
    lines = [
        "export const maziiData = [",
        "  // meaning -> [\"kanji\", \"kana\", \"english\", \"indonesian\", \"ex1_jp\", \"ex1_romaji\", \"ex1_id\", \"ex2_jp\", \"ex2_romaji\", \"ex2_id\", \"ex1_en\", \"ex2_en\"]"
    ]
    for r in all_entries:
        row_json = json.dumps(r, ensure_ascii=False)
        lines.append(f"  {row_json},")
    lines.append("];")
    lines.append("")

    with open(mazii_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"Updated {mazii_path} with {len(all_entries)} entries.")

    # 2. Extract coreVocab items for src/data/vocab.js
    core_keys = ["停止", "構造", "周辺", "体制", "指定", "調整"]
    core_lookup = {}
    for r in all_entries:
        if r[0] in core_keys and r[0] not in core_lookup:
            core_lookup[r[0]] = r

    core_vocab = [core_lookup[k] for k in core_keys]
    assert len(core_vocab) == 6, f"Expected 6 coreVocab items, got {len(core_vocab)}"

    vocab_path = 'src/data/vocab.js'
    v_lines = [
        "import { maziiData } from './mazii.js';",
        "",
        "const coreVocab = ["
    ]
    for r in core_vocab:
        row_json = json.dumps(r, ensure_ascii=False)
        v_lines.append(f"  {row_json},")
    v_lines.append("];")
    v_lines.append("")
    v_lines.append("// Combine coreVocab and maziiData without duplicates on word")
    v_lines.append("const wordSet = new Set(coreVocab.map(v => v[0]));")
    v_lines.append("const combinedVocab = [...coreVocab];")
    v_lines.append("")
    v_lines.append("for (const m of maziiData) {")
    v_lines.append("  if (!wordSet.has(m[0])) {")
    v_lines.append("    wordSet.add(m[0]);")
    v_lines.append("    combinedVocab.push(m);")
    v_lines.append("  }")
    v_lines.append("}")
    v_lines.append("")
    v_lines.append("export const vocab = combinedVocab;")
    v_lines.append("")

    with open(vocab_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(v_lines))
    print(f"Updated {vocab_path} with {len(core_vocab)} coreVocab items and combined export.")

if __name__ == '__main__':
    main()
