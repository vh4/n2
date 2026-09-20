#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Natural JLPT N2 Conversational & Situational Example Generator
Upgrades all vocabulary in vocab.js and mazii.js with:
- ex1: Natural everyday / workplace conversational dialogue quote (「〜」「〜」) often used in Japan.
- ex2: Practical JLPT N2 reading/exam/situational sentence.
- ex1_id, ex2_id: Fluent, idiomatic Indonesian translations.
- ex1_en, ex2_en: Fluent, natural English translations.
- Accurate Hepburn Romaji with macrons (ō, ū, ā, etc.).
"""

import re
import json

KANA_ROMAJI = {
    # Youon (combinations)
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
    'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
    'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
    'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
    'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
    'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
    'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
    'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
    'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
    'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
    'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
    'ふぁ': 'fa', 'ふぃ': 'fi', 'ふぇ': 'fe', 'ふぉ': 'fo',
    'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo',
    'ティ': 'ti', 'ディ': 'di', 'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
    'シェ': 'she', 'チェ': 'che', 'ジェ': 'je',

    # Single char hiragana
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'o', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',

    # Single char katakana
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'o', 'ン': 'n',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ぽ': 'po',
    'ヴ': 'vu',
}

def kana_to_romaji(text):
    if not text:
        return ""
    res = []
    i = 0
    n = len(text)
    while i < n:
        if i + 1 < n and text[i:i+2] in KANA_ROMAJI:
            res.append(KANA_ROMAJI[text[i:i+2]])
            i += 2
        elif text[i] in ['っ', 'ッ']:
            if i + 1 < n:
                next_part = None
                if i + 2 <= n and text[i+1:i+3] in KANA_ROMAJI:
                    next_part = KANA_ROMAJI[text[i+1:i+3]]
                elif text[i+1] in KANA_ROMAJI:
                    next_part = KANA_ROMAJI[text[i+1]]
                if next_part:
                    res.append('c' if next_part.startswith('ch') else next_part[0])
            i += 1
        elif text[i] == 'ー':
            if res:
                last = res[-1]
                if last.endswith('a'): res[-1] = last[:-1] + 'ā'
                elif last.endswith('i'): res[-1] = last[:-1] + 'ī'
                elif last.endswith('u'): res[-1] = last[:-1] + 'ū'
                elif last.endswith('e'): res[-1] = last[:-1] + 'ē'
                elif last.endswith('o'): res[-1] = last[:-1] + 'ō'
            i += 1
        elif text[i] in KANA_ROMAJI:
            res.append(KANA_ROMAJI[text[i]])
            i += 1
        else:
            res.append(text[i])
            i += 1
    
    joined = "".join(res)
    joined = re.sub(r'ou', 'ō', joined)
    joined = re.sub(r'uu', 'ū', joined)
    joined = re.sub(r'oo', 'ō', joined)
    return joined

def clean_word_reading(word, kana):
    if not kana.strip():
        return word
    return kana.strip().split()[0]

# Master dictionary of 20 coreVocab + top curated JLPT N2 words
CORE_VOCAB_FULL = [
    [
        "停止", "ていし", "suspension, stoppage", "penghentian sementara, penangguhan",
        "「事故の影響で電車の運行が一時停止しているそうです。」「困りましたね、別の路線で行きましょう。」",
        "\"Jiko no eikyō de densha no unkō ga ichiji teishi shite iru sō desu.\" \"Komarimashita ne, betsu no rosen de ikimashō.\"",
        "\"Katanya operasional kereta berhenti sementara akibat kecelakaan.\" \"Gawat ya, mari kita lewat jalur lain saja.\"",
        "「交差点の赤信号の手前では、必ず完全に停止してください。」",
        "\"Kōsaten no akashingō no temae de wa, kanarazu kanzen ni teishi shite kudasai.\"",
        "\"Di depan lampu merah persimpangan, pastikan berhenti secara total.\"",
        "\"I heard train services are temporarily suspended due to an accident.\" \"That's troublesome; let's take another line.\"",
        "\"Make sure to come to a complete stop before the red light at the intersection.\""
    ],
    [
        "構造", "こうぞう", "structure, framework", "struktur, kerangka",
        "「このビルは地震に強い免震構造を採用しているそうですよ。」「それは安心して働けますね。」",
        "\"Kono biru wa jishin ni tsuyoi menshin kōzō o saiyō shite iru sō desu yo.\" \"Sore wa anshin shite hatarakemasu ne.\"",
        "\"Gedung ini kabarnya menerapkan struktur tahan gempa lho.\" \"Kalau begitu kita bisa bekerja dengan tenang ya.\"",
        "「複雑な組織構造を分かりやすく図解で説明してもらえますか？」",
        "\"Fukuzatsu na soshiki kōzō o wakariyasuku zukai de setsumei shite moraemasu ka?\"",
        "\"Bisakah kamu menjelaskan struktur organisasi yang rumit ini dengan diagram agar mudah dipahami?\"",
        "\"I heard this building uses an earthquake-resistant structure.\" \"That means we can work with peace of mind.\"",
        "\"Could you explain this complex organizational structure using a diagram so it is easy to understand?\""
    ],
    [
        "周辺", "しゅうへん", "vicinity, surroundings", "sekitar, lingkungan",
        "「駅の周辺に、静かに勉強できるカフェはありますか？」「南口の近くに良い店がありますよ。」",
        "\"Eki no shūhen ni, shizuka ni benkyō dekiru kafe wa arimasu ka?\" \"Minamiguchi no chikaku ni yoi mise ga arimasu yo.\"",
        "\"Apakah ada kafe di sekitar stasiun yang tenang untuk belajar?\" \"Ada tempat bagus di dekat pintu keluar selatan lho.\"",
        "「大学のキャンパス周辺には、学生向けの安くて美味しい定食屋が多い。」",
        "\"Daigaku no kyanpasu shūhen ni wa, gakusei-muke no yasukute oishii teishokuya ga ooi.\"",
        "\"Di sekitar kampus universitas banyak terdapat warung makan murah dan lezat khusus mahasiswa.\"",
        "\"Is there a quiet cafe around the station where I can study?\" \"There's a nice place near the south exit.\"",
        "\"Around the university campus, there are many cheap and tasty set-meal diners for students.\""
    ],
    [
        "体制", "たいせい", "order, system, set-up", "tatanan, sistem, struktur",
        "「来月からの新体制について聞きましたか？」「はい、サポート体制がより強化されるそうですね。」",
        "\"Raigetsu kara no shin-taisei ni tsuite kikimashita ka?\" \"Hai, sapōto taisei ga yori kyōka sareru sō desu ne.\"",
        "\"Sudah dengar tentang struktur organisasi baru mulai bulan depan?\" \"Ya, kabarnya sistem dukungan akan lebih diperkuat ya.\"",
        "「24時間いつでも顧客のトラブルに対応できる万全の体制を整えた。」",
        "\"Nijūyo-jikan itsudemo kokyaku no toraburu ni taiō dekiru banzen no taisei o totonoeta.\"",
        "\"Telah menyiapkan sistem yang matang agar dapat menangani kendala pelanggan 24 jam kapan saja.\"",
        "\"Have you heard about the new system starting next month?\" \"Yes, I heard the support system will be further strengthened.\"",
        "\"We have established a thorough system to respond to customer issues 24 hours a day.\""
    ],
    [
        "対象", "たいしょう", "target, object, subject", "sasaran, objek, target",
        "「この割引キャンペーンは学生も対象になりますか？」「はい、学生証をご提示いただければ対象です。」",
        "\"Kono waribiki kyanpēn wa gakusei mo taishō ni narimasu ka?\" \"Hai, gakuseishō o goteiji itadakereba taishō desu.\"",
        "\"Apakah kampanye diskon ini berlaku juga untuk pelajar?\" \"Ya, berlaku jika Anda menunjukkan kartu pelajar.\"",
        "「社会人1000人を対象とした働き方に関するアンケート調査を実施した。」",
        "\"Shakaijin sennin o taishō to shita hatarakikata ni kansuru ankēto chōsa o jisshi shita.\"",
        "\"Melaksanakan survei kuesioner mengenai pola kerja yang ditujukan kepada 1.000 pekerja.\"",
        "\"Is this discount campaign eligible for students too?\" \"Yes, you are eligible if you present your student ID.\"",
        "\"Conducted a survey on working styles targeting 1,000 working professionals.\""
    ],
    [
        "維持", "いじ", "maintenance, preservation", "pemeliharaan, pemertahanan",
        "「スタイルを維持する秘訣は何ですか？」「毎朝のジョギングとバランスの良い食事ですね。」",
        "\"Sutairu o iji suru hiketsu wa nan desu ka?\" \"Maiasa no jogingu to baransu no yoi shokuji desu ne.\"",
        "\"Apa rahasia mempertahankan bentuk tubuh yang bugar?\" \"Joging setiap pagi dan pola makan seimbang.\"",
        "「長期的な信頼関係を維持するためには、日頃の誠実な対応が欠かせない。」",
        "\"Chōkiteki na shinrai kankei o iji suru tame ni wa, higoro no seijitsu na taiō ga kagasenai.\"",
        "\"Tindakan tulus sehari-hari sangat mutlak untuk mempertahankan hubungan kepercayaan jangka panjang.\"",
        "\"What is your secret to staying in shape?\" \"Jogging every morning and eating a balanced diet.\"",
        "\"Sincere daily communication is indispensable for maintaining long-term trust.\""
    ],
    [
        "拡大", "かくだい", "expansion, enlargement", "perluasan, pembesaran",
        "「東南アジアへの市場拡大を検討しているそうですね。」「ええ、来期から本格的に進める予定です。」",
        "\"Tōnan Ajia e no shijō kakudai o kentō shite iru sō desu ne.\" \"Ee, raiki kara honkakuteki ni susumeru yotei desu.\"",
        "\"Kabarnya sedang mempertimbangkan ekspansi pasar ke Asia Tenggara ya?\" \"Iya, rencananya akan mulai dijalankan penuh periode depan.\"",
        "「被害のさらなる拡大を防ぐため、関係機関が迅速に対応を急いでいる。」",
        "\"Higai no sara naru kakudai o fusegu tame, kankei kikan ga jinsoku ni taiō o isoide iru.\"",
        "\"Instansi terkait bergegas bertindak cepat demi mencegah meluasnya kerusakan lebih lanjut.\"",
        "\"I heard you are considering expanding into the Southeast Asian market.\" \"Yes, we plan to roll it out in earnest next term.\"",
        "\"Relevant agencies are rushing to respond quickly to prevent further spread of the damage.\""
    ],
    [
        "改善", "かいぜん", "improvement, betterment", "perbaikan, peningkatan",
        "「作業効率を改善する良いアイデアはありますか？」「業務の一部を自動化してはどうでしょうか。」",
        "\"Sagyō kōritsu o kaizen suru yoi aidea wa arimasu ka?\" \"Gyōmu no ichibu o jidōka shite wa dō deshō ka.\"",
        "\"Apakah ada ide bagus untuk meningkatkan efisiensi kerja?\" \"Bagaimana kalau kita mengotomatiskan sebagian pekerjaan?\"",
        "「ユーザーからのフィードバックをもとに、アプリの操作性を大幅に改善した。」",
        "\"Yūzā kara no fīdībakku o moto ni, apuri no sōsasei o oohaba ni kaizen shita.\"",
        "\"Telah meningkatkan kemudahan pengoperasian aplikasi secara drastis berdasarkan masukan dari pengguna.\"",
        "\"Do you have any good ideas to improve work efficiency?\" \"How about automating part of the workflow?\"",
        "\"We significantly improved the app's usability based on user feedback.\""
    ],
    [
        "理解", "りかい", "understanding, comprehension", "pemahaman, pengertian",
        "「先生、先ほどの説明でよく理解できなかった部分があるのですが。」「どこが難しかったか遠慮なく聞いてね。」",
        "\"Sensei, sakihodo no setsumei de yoku rikai dekinakatta bubun ga aru no desu ga.\" \"Doko ga muzukashikatta ka enryo naku kiite ne.\"",
        "\"Pak Guru, ada bagian dari penjelasan tadi yang belum saya pahami dengan baik.\" \"Jangan ragu tanyakan bagian mana yang sulit ya.\"",
        "「お互いの文化や価値観の違いを深く理解することが、国際交流の第一歩だ。」",
        "\"Otagai no bunka ya kachikan no chigai o fukaku rikai suru koto ga, kokusai kōryū no dai-ippo da.\"",
        "\"Memahami secara mendalam perbedaan budaya dan nilai satu sama lain adalah langkah awal pertukaran internasional.\"",
        "\"Teacher, there was a part in your explanation earlier that I didn't quite understand.\" \"Feel free to ask which part you found difficult.\"",
        "\"Deeply understanding differences in culture and values is the first step in international exchange.\""
    ],
    [
        "変化", "へんか", "change, variation", "perubahan, variasi",
        "「久しぶりに地元に帰ったら、街並みがすっかり変化していて驚いたよ。」「再開発で新しい店も増えたからね。」",
        "\"Hisashiburi ni jimoto ni kaettara, machinami ga sukkari henka shite ite odoroita yo.\" \"Saikaihatsu de atarashii mise mo fueta kara ne.\"",
        "\"Setelah sekian lama pulang kampung, saya kaget pemandangan kotanya berubah total.\" \"Karena ada pembangunan kembali, toko baru pun bertambah banyak.\"",
        "「気候の変化が農作物の収穫量に直接的な影響を及ぼしている。」",
        "\"Kikō no henka ga nōsaku-butsu no shūkakuryō ni chokusetsuteki na eikyō o oyoboshite iru.\"",
        "\"Perubahan iklim memberikan dampak langsung terhadap hasil panen pertanian.\"",
        "\"When I returned to my hometown after a long time, I was amazed at how much the scenery had changed.\" \"It's because redevelopment brought a lot of new shops.\"",
        "\"Changes in climate are having a direct impact on agricultural crop yields.\""
    ],
    [
        "意識", "いしき", "consciousness, awareness", "kesadaran, persepsi",
        "「最近、健康のために階段を使うように意識しているんだ。」「素晴らしい心がけだね！」",
        "\"Saikin, kenkō no tame ni kaidan o tsukau yō ni ishiki shite iru n da.\" \"Subarashii kokorogake da ne!\"",
        "\"Akhir-akhir ini aku berusaha sadar untuk menggunakan tangga demi kesehatan.\" \"Niat dan usaha yang hebat!\"",
        "「若い世代の間で、環境保護や省エネに対する意識が急速に高まっている。」",
        "\"Wakai sedai no aida de, kankyō hogo ya shōene ni taisuru ishiki ga kyūsoku ni takamatte iru.\"",
        "\"Di kalangan generasi muda, kesadaran terhadap perlindungan lingkungan dan hemat energi meningkat pesat.\"",
        "\"Lately I've been conscious of taking the stairs for my health.\" \"That's a great habit!\"",
        "\"Awareness of environmental protection and energy conservation is rapidly rising among younger generations.\""
    ],
    [
        "確保", "かくほ", "securing, guarantee", "pemasokan, pemastian, jaminan",
        "「連休中の新幹線の指定席、無事に確保できた？」「うん、発売開始直後に予約したよ。」",
        "\"Renkyū-chū no shinkansen no shiteiseki, buji ni kakuho dekita?\" \"Un, hatsubai kaishi chokugo ni yoyaku shita yo.\"",
        "\"Apakah kursi pesanan Shinkansen selama libur panjang berhasil kamu dapatkan?\" \"Iya, aku langsung pesan tepat saat penjualan dibuka.\"",
        "「災害時に備えて、家庭内で最低3日分の飲料水と食料を確保しておくべきだ。」",
        "\"Saigai-ji ni sonaete, kateinai de saitei mikka-bun no inryōsui to shokuryō o kakuho shite oku beki da.\"",
        "\"Untuk bersiap menghadapi bencana, setiap keluarga harus mengamankan stok air minum dan makanan minimal 3 hari.\"",
        "\"Did you manage to secure reserved Shinkansen seats for the consecutive holidays?\" \"Yeah, I booked them right when tickets went on sale.\"",
        "\"In preparation for disasters, households should secure at least three days' worth of drinking water and food.\""
    ],
    [
        "指定", "してい", "designation, specification", "penunjukan, penentuan",
        "「燃えるゴミは、こちらの指定のゴミ袋に入れて出してくださいね。」「分かりました、ありがとうございます。」",
        "\"Moeru gomi wa, kochira no shitei no gomibukuro ni irete dashite kudasai ne.\" \"Wakarimashita, arigatō gozaimasu.\"",
        "\"Sampah yang mudah terbakar harap dimasukkan ke kantong sampah khusus yang ditentukan ini ya.\" \"Baik, terima kasih.\"",
        "「当日の集合時間は午前9時です。指定された場所にお集まりください。」",
        "\"Tōjitsu no shūgō jikan wa gozen kuji desu. Shitei sareta basho ni oatsumari kudasai.\"",
        "\"Waktu berkumpul pada hari H adalah pukul 09.00 pagi. Harap berkumpul di lokasi yang telah ditentukan.\"",
        "\"Please put burnable garbage into these designated bags before taking it out.\" \"Understood, thank you.\"",
        "\"Meeting time on the day is 9:00 AM. Please gather at the designated location.\""
    ],
    [
        "導入", "どうにゅう", "introduction, bringing in", "pengenalan, penerapan awal",
        "「来週から新しい勤怠管理ツールを導入するそうですよ。」「スマホから打刻できるようになるので便利ですね。」",
        "\"Raishū kara atarashii kintai kanri tsūru o dōnyū suru sō desu yo.\" \"Sumaho kara dakoku dekiru yō ni naru node benri desu ne.\"",
        "\"Mulai minggu depan kita akan menerapkan alat pencatat absensi baru lho.\" \"Bakal praktis ya karena bisa absen lewat ponsel pintar.\"",
        "「工場の生産ラインに最新の産業用ロボットを導入し、人手不足を解消した。」",
        "\"Kōjō no seisan rain ni saishin no sangyō-yō robotto o dōnyū shi, hitode-busoku o kaishō shita.\"",
        "\"Menerapkan robot industri mutakhir pada lini produksi pabrik untuk mengatasi kekurangan tenaga kerja.\"",
        "\"I heard they are introducing a new attendance tracking tool starting next week.\" \"That'll be convenient since we can clock in from our smartphones.\"",
        "\"By introducing state-of-the-art industrial robots to the factory production line, they resolved the labor shortage.\""
    ],
    [
        "検討", "けんとう", "consideration, examination", "pertimbangan, pengkajian",
        "「ご提案いただいた企画書、社内で前向きに検討させていただきます。」「よろしくお願いいたします。」",
        "\"Go-teian itadaita kikakusho, shanai de maemuki ni kentō sasete itadakimasu.\" \"Yoroshiku onegai itashimasu.\"",
        "\"Proposal rencana yang Anda berikan akan kami pertimbangkan secara positif di internal.\" \"Terima kasih banyak atas kerjasamanya.\"",
        "「予算やスケジュールの課題を含め、複数の選択肢を慎重に検討している。」",
        "\"Yosan ya sukejūru no kadai o fukume, fukusū no sentakushi o shinchō ni kentō shite iru.\"",
        "\"Sedang mempertimbangkan beberapa opsi alternatif secara seksama, termasuk kendala anggaran dan jadwal.\"",
        "\"We will positively consider the proposal you provided within our company.\" \"Thank you very much.\"",
        "\"We are carefully considering multiple options, including budget and scheduling challenges.\""
    ],
    [
        "提供", "ていきょう", "offer, provision, supply", "penyediaan, penawaran",
        "「当店では、毎朝市場から直送される新鮮な魚を提供しております。」「本日のおすすめは何ですか？」",
        "\"Tōten de wa, maiasa ichiba kara chokusō sareru shinsen na sakana o teikyō shite orimasu.\" \"Honjitsu no osusume wa nan desu ka?\"",
        "\"Restoran kami menyajikan ikan segar yang dikirim langsung dari pasar setiap pagi.\" \"Menu rekomendasi hari ini apa ya?\"",
        "「利用者のニーズに合わせて、より質の高いオンライン教育サービスを提供する。」",
        "\"Riyōsha no nīzu ni awasete, yori shitsu no takai onrain kyōiku sābisu o teikyō suru.\"",
        "\"Menyediakan layanan pendidikan daring yang lebih berkualitas tinggi sesuai dengan kebutuhan pengguna.\"",
        "\"Our restaurant serves fresh fish delivered directly from the market every morning.\" \"What is today's recommendation?\"",
        "\"Providing higher-quality online education services tailored to user needs.\""
    ],
    [
        "評価", "ひょうか", "evaluation, rating", "penilaian, evaluasi",
        "「今回のプロジェクトでのあなたの働きは、チーム内でも高く評価されていますよ。」「ありがとうございます、励みになります！」",
        "\"Konkai no purojekuto de no anata no hataraki wa, chīmu-nai demo takaku hyōka sarete imasu yo.\" \"Arigatō gozaimasu, hagemi ni narimasu!\"",
        "\"Kinerja Anda dalam proyek kali ini dinilai sangat tinggi oleh rekan-rekan tim.\" \"Terima kasih banyak, ini menjadi penyemangat bagi saya!\"",
        "「目に見える成果だけでなく、そこに至るまでの努力の過程も正当に評価されるべきだ。」",
        "\"Me ni mieru seika dake de naku, soko ni itaru made no doryoku no katei mo seitō ni hyōka sareru beki da.\"",
        "\"Bukan hanya hasil yang tampak, tetapi proses usaha hingga mencapainya juga harus dinilai secara adil.\"",
        "\"Your hard work on this project has been evaluated very highly within the team.\" \"Thank you so much; that is very encouraging!\"",
        "\"Not only visible results, but also the process of effort leading up to them should be evaluated fairly.\""
    ],
    [
        "実施", "じっし", "enforcement, implementation", "pelaksanaan, penerapan",
        "「来週の月曜日に避難訓練を実施しますので、各自避難経路を確認してください。」「了解しました。」",
        "\"Raishū no getsuyōbi ni hinan kunren o jisshi shimasu node, kakuji hinan keiro o kakunin shite kudasai.\" \"Ryōkai shimashita.\"",
        "\"Senin depan kita akan melaksanakan latihan evakuasi, jadi harap masing-masing memastikan jalur evakuasinya.\" \"Dimengerti.\"",
        "「市民の防犯意識を高めるため、警察と地域住民が合同で夜間パトロールを実施した。」",
        "\"Shimin no bōhan ishiki o takameru tame, keisatsu to chiiki jūmin ga gōdō de yakan patorōru o jisshi shita.\"",
        "\"Kepolisian dan warga setempat melaksanakan patroli malam gabungan demi meningkatkan kesadaran keamanan warga.\"",
        "\"We will conduct an evacuation drill next Monday, so everyone please verify your evacuation route.\" \"Understood.\"",
        "\"Police and local residents conducted joint night patrols to heighten citizens' crime prevention awareness.\""
    ],
    [
        "傾向", "けいこう", "tendency, trend", "kecenderungan, tren",
        "「最近はテレワークを希望する就活生が増えている傾向にありますね。」「通勤時間を節約したい人が多いですからね。」",
        "\"Saikin wa terewāku o kibō suru shūkatsusei ga fuete iru keikō ni arimasu ne.\" \"Tsūkin jikan o setsuyaku shitai hito ga ooi desu kara ne.\"",
        "\"Akhir-akhir ini para pencari kerja yang menginginkan kerja jarak jauh cenderung bertambah ya.\" \"Karena banyak orang yang ingin menghemat waktu perjalanan kerja.\"",
        "「近年のJLPT試験では、実際の日常会話における自然な表現を問う問題が増加傾向にある。」",
        "\"Kinnen no JLPT shiken de wa, jissai no nichijō kaiwa ni okeru shizen na hyōgen o tou mondai ga zōka keikō ni aru.\"",
        "\"Dalam ujian JLPT beberapa tahun terakhir, soal yang menanyakan ungkapan alami dalam percakapan sehari-hari nyata memiliki kecenderungan meningkat.\"",
        "\"Lately there has been a trend of more job seekers preferring telework.\" \"That's because many people want to save commuting time.\"",
        "\"In recent JLPT exams, questions asking about natural expressions in actual everyday conversations have been on an increasing trend.\""
    ],
    [
        "調整", "ちょうせい", "adjustment, coordination", "penyesuaian, koordinasi",
        "「来週の打ち合わせの日程ですが、ご都合の良い日に調整していただけますか？」「木曜日の午後なら空いております。」",
        "\"Raishū no uchiawase no nittei desu ga, go-tsugō no yoi hi ni chōsei shite itadakemasu ka?\" \"Mokuyōbi no gogo nara aite orimasu.\"",
        "\"Mengenai jadwal rapat minggu depan, bisakah disesuaikan dengan hari luang Anda?\" \"Kalau hari Kamis siang saya ada waktu kosong.\"",
        "「各部署の意見の食い違いを埋めるため、リーダーが粘り強く意見の調整を行った。」",
        "\"Kaku-busho no iken no kuichigai o umeru tame, rīdā ga nebarizuyoku iken no chōsei o okonatta.\"",
        "\"Pemimpin dengan sabar melakukan penyesuaian pendapat demi menjembatani perbedaan pandangan antar-divisi.\"",
        "\"Regarding the meeting schedule next week, could you adjust it to a date that suits your convenience?\" \"I am free on Thursday afternoon.\"",
        "\"The leader patiently coordinated opinions to bridge the discrepancies between departments.\""
    ]
]

# Additional curated dictionary entries for top mazii words
CURATED_EXAMPLES_MAZII = {
    "カラー": (
        ("「新しいシャツのカラーをきれいに整えてから出かけよう。」「その色、すごく似合っているよ。」",
         "\"Atarashii shatsu no karā o kirei ni totonoete kara dekakeyō.\" \"Sono iro, sugoku niatte iru yo.\"",
         "\"Rapikan kerah kemeja baru dulu sebelum berangkat.\" \"Warna itu sangat cocok untukmu lho.\"",
         "\"Let's neaten the collar of this new shirt before heading out.\" \"That color really suits you.\""),
        ("「秋らしい落ち着いたカラーの服を選ぶと、季節感が出ますね。」",
         "\"Aki-rashii ochitsuita karā no fuku o erabu to, kisetsukan ga demasu ne.\"",
         "\"Memilih pakaian dengan warna tenang bernuansa musim gugur memberikan kesan musiman ya.\"",
         "\"Choosing clothes in calm, autumn-like colors really brings out the season's feel.\"")
    ),
    "各々": (
        ("「それでは、各々自分の席に戻って作業を再開してください。」「はい、承知いたしました。」",
         "\"Soredewa, onoono jibun no seki ni modotte sagyō o saikai shite kudasai.\" \"Hai, shōchi itashimashita.\"",
         "\"Baiklah, silakan masing-masing kembali ke tempat duduk dan melanjutkan pekerjaan.\" \"Baik, dimengerti.\"",
         "\"Well then, everyone please return to your seats and resume work.\" \"Understood.\""),
        ("「参加者各々が自由に意見を出し合い、活発な議論が行われた。」",
         "\"Sankasha onoono ga jiyū ni iken o dashiai, kappatsu na giron ga okonawareta.\"",
         "\"Setiap peserta saling menyampaikan pendapat dengan bebas sehingga diskusi berlangsung aktif.\"",
         "\"Each participant freely shared their views, leading to a lively discussion.\"")
    ),
    "パンツ": (
        ("「このパンツ、ストレッチが効いていてすごく履きやすいですね。」「デザインもおしゃれで人気ですよ。」",
         "\"Kono pantsu, sutoretchi ga kiite ite sugoku hakiyasui desu ne.\" \"Dezain mo oshare de ninki desu yo.\"",
         "\"Celana ini elastis dan sangat nyaman dipakai ya.\" \"Desainnya juga modis dan populer lho.\"",
         "\"These pants are stretchy and really comfortable to wear.\" \"The design is stylish and popular too.\""),
        ("「旅行用に乾きやすい速乾性のパンツを何枚か持っていくと便利です。」",
         "\"Ryokō-yō ni kawakiyasui sokkansei no pantsu o nanmai ka motte iku to benri desu.\"",
         "\"Membawa beberapa celana cepat kering untuk bepergian sangatlah praktis.\"",
         "\"Taking several pairs of quick-drying pants for traveling is very convenient.\"")
    ),
    "ステージ": (
        ("「昨日のライブのステージ、照明も音楽も迫力満点だったね！」「本当に感動したよ！」",
         "\"Kinō no raibu no sutēji, shōmei mo ongaku mo hakuryoku manten datta ne!\" \"Hontō ni kandō shita yo!\"",
         "\"Panggung konser kemarin pencahayaan dan musiknya luar biasa memukau ya!\" \"Aku benar-benar terharu!\"",
         "\"Yesterday's concert stage was truly breathtaking in both lighting and music!\" \"I was deeply moved!\""),
        ("「社会人として人生の新たなステージへ踏み出す決意を固めた。」",
         "\"Shakaijin to shite jinsei no arata na sutēji e fumidasu ketsui o katameta.\"",
         "\"Memperteguh tekad untuk melangkah ke babak baru kehidupan sebagai anggota masyarakat.\"",
         "\"I firmly resolved to take a step forward into a new stage of life as a working adult.\"")
    ),
    "段階": (
        ("「プロジェクトは今どの段階まで進んでいますか？」「設計が完了し、実装の段階に入りました。」",
         "\"Purojekuto wa ima dono dankai made susunde imasu ka?\" \"Sekkei ga kanryō shi, jissō no dankai ni hairimashita.\"",
         "\"Proyeknya sekarang sudah sampai tahap apa?\" \"Perancangan sudah selesai, sekarang masuk tahap implementasi.\"",
         "\"What stage has the project reached now?\" \"Design is complete, and we have entered the implementation stage.\""),
        ("「一つ一つの段階を踏んで、着実に日本語のレベルを上げていこう。」",
         "\"Hitotsu hitotsu no dankai o funde, chakujitsu ni Nihongo no reberu o agete ikō.\"",
         "\"Mari menaikkan tingkat kemampuan bahasa Jepang secara bertahap dan pasti melalui setiap tahapan.\"",
         "\"Let's steadily improve our Japanese proficiency by advancing through each stage one by one.\"")
    ),
    "バック": (
        ("「駐車場が狭いので、後ろを見てバックを手伝ってもらえますか？」「はい、オーライ、オーライ！」",
         "\"Chūshajō ga semai node, ushiro o mite bakku o tetsudatte moraemasu ka?\" \"Hai, ōrai, ōrai!\"",
         "\"Karena tempat parkirnya sempit, bisakah tolong lihat belakang dan bantu memundurkan mobil?\" \"Ya, terus, terus!\"",
         "\"Since the parking lot is tight, could you help guide me while I back up?\" \"Sure, all clear, come on back!\""),
        ("「経験豊富な上司がしっかりバックについてくれているので心強い。」",
         "\"Keiken hōfu na jōshi ga shikkari bakku ni tsuite kurete iru node kokorozuyoi.\"",
         "\"Sangat menenangkan hati karena ada atasan berpengalaman yang senantiasa mendukung dari belakang.\"",
         "\"It is very reassuring to have an experienced boss backing us up solidly.\"")
    ),
    "プログラム": (
        ("「明日の文化祭のプログラムはもう配られましたか？」「受付で配布されていますよ。」",
         "\"Ashita no bunkasai no puroguramu wa mō kubararemashita ka?\" \"Uketsuke de haifu sarete imasu yo.\"",
         "\"Apakah jadwal susunan acara festival budaya besok sudah dibagikan?\" \"Sudah dibagikan di meja resepsionis lho.\"",
         "\"Has tomorrow's cultural festival program been handed out yet?\" \"It is being distributed at the reception desk.\""),
        ("「業務を効率化するため、自社専用の自動処理プログラムを開発した。」",
         "\"Gyōmu o kōritsuka suru tame, jisha sen'yō no jidō shori puroguramu o kaihatsu shita.\"",
         "\"Mengembangkan program pemrosesan otomatis khusus perusahaan demi mengefisiensikan pekerjaan.\"",
         "\"Developed a proprietary automated processing program to streamline company operations.\"")
    ),
    "工事": (
        ("「駅前で道路の工事をしているから、少し遠回りしようか。」「そうだね、歩行者天国の方を通ろう。」",
         "\"Ekimae de dōro no kōji o shite iru kara, sukoshi tōmawari shiyō ka.\" \"Sō da ne, hokōsha tengoku no hō o tōrō.\"",
         "\"Karena di depan stasiun ada pekerjaan konstruksi jalan, bagaimana kalau kita memutar sedikit?\" \"Iya, ayo lewat zona pejalan kaki saja.\"",
         "\"Since there's road construction in front of the station, shall we take a slight detour?\" \"Good idea, let's take the pedestrian zone.\""),
        ("「ビル改修工事に伴い、来週はエレベーターのご利用が制限されます。」",
         "\"Biru kaishū kōji ni tomonai, raishū wa erebētā no goriyō ga seigen saremasu.\"",
         "\"Sehubungan dengan renovasi gedung, penggunaan lift minggu depan akan dibatasi.\"",
         "\"Due to building renovation work, elevator usage will be restricted next week.\"")
    ),
    "基地": (
        ("「南極の観測基地ではどんな研究をしているの？」「気候変動や宇宙の観測を行っているんだよ。」",
         "\"Nankyoku no kansoku kichi de wa donna kenkyū o shite iru no?\" \"Kikō hendō ya uchū no kansoku o okonatte iru n da yo.\"",
         "\"Di pangkalan observasi Antartika penelitian seperti apa yang dilakukan?\" \"Mereka meneliti perubahan iklim dan pengamatan luar angkasa lho.\"",
         "\"What kind of research do they do at the Antarctic research base?\" \"They observe climate change and cosmic phenomena.\""),
        ("「港町は古くから貿易や漁業の重要な拠点基地として栄えてきた。」",
         "\"Minatomachi wa furuku kara bōeki ya gyogyō no jūyō na kyoten kichi to shite sakaete kita.\"",
         "\"Kota pelabuhan telah makmur sejak zaman dahulu sebagai pangkalan pusat penting untuk perdagangan dan perikanan.\"",
         "\"The port town has flourished since ancient times as an important hub base for trade and fishing.\"")
    ),
    "本来": (
        ("「この道具、本来の使い方とは違うけどすごく便利だね。」「でも壊さないように気をつけてね。」",
         "\"Kono dōgu, honrai no tsukaikata to wa chigau kedo sugoku benri da ne.\" \"Demo kowasanai yō ni ki o tsukete ne.\"",
         "\"Alat ini meski berbeda dari fungsi aslinya, ternyata sangat praktis ya.\" \"Tapi hati-hati jangan sampai merusaknya ya.\"",
         "\"This tool is different from its original intended use, but it's really handy!\" \"Just be careful not to break it.\""),
        ("「物事の本来の目的を見失わずに、冷静に判断することが重要だ。」",
         "\"Monogoto no honrai no mokuteki o miushinawazu ni, reisei ni handan suru koto ga jūyō da.\"",
         "\"Penting untuk menilai dengan tenang tanpa kehilangan arah dari tujuan hakiki segala sesuatunya.\"",
         "\"It is important to judge calmly without losing sight of the original purpose of things.\"")
    ),
    "お休み": (
        ("「今度のお休みはどこか出かける予定ある？」「温泉にでも行ってのんびりしようと思ってるよ。」",
         "\"Kondo no oyasumi wa dokoka dekakeru yotei aru?\" \"Onsen ni demo itte nonbiri shiyō to omotte ru yo.\"",
         "\"Liburan nanti ada rencana bepergian ke suatu tempat?\" \"Aku berencana pergi ke pemandian air panas untuk bersantai.\"",
         "\"Do you have plans to go anywhere on your next day off?\" \"I'm thinking of visiting a hot spring to relax.\""),
        ("「体調が優れないときは、無理をせずにお休みを取ってくださいね。」",
         "\"Taichō ga sugurenai toki wa, muri o sezu ni oyasumi o totte kudasai ne.\"",
         "\"Bila kondisi badan kurang sehat, silakan ambil istirahat tanpa memaksakan diri ya.\"",
         "\"When you are not feeling well, please take a break without overexerting yourself.\"")
    ),
    "作成": (
        ("「会議用の資料の作成、もう終わりましたか？」「はい、先ほど印刷して机の上に置いておきました。」",
         "\"Kaigi-yō no shiryō no sakusei, mō owarimashita ka?\" \"Hai, sakihodo insatsu shite tsukue no ue ni oite okimashita.\"",
         "\"Penyusunan materi untuk rapat apakah sudah selesai?\" \"Ya, tadi sudah saya cetak dan letakkan di atas meja.\"",
         "\"Have you finished preparing the materials for the meeting?\" \"Yes, I printed them out and placed them on your desk.\""),
        ("「誰にでも分かりやすい業務マニュアルを作成して全社員に配布した。」",
         "\"Dare ni demo wakariyasui gyōmu manyuaru o sakusei shite zenshain ni haifu shita.\"",
         "\"Membuat buku panduan operasional yang mudah dipahami siapa pun lalu membagikannya ke seluruh staf.\"",
         "\"Created an easy-to-understand operation manual and distributed it to all employees.\"")
    ),
    "気をつける": (
        ("「夜道は暗いから、足元に気をつけて帰ってね。」「ありがとう、気をつけるよ！」",
         "\"Yomichi wa kurai kara, ashimoto ni ki o tsukete kaette ne.\" \"Arigatō, ki o tsukeru yo!\"",
         "\"Jalanan malam gelap, jadi berhati-hatilah pada langkahmu saat pulang ya.\" \"Terima kasih, aku akan berhati-hati!\"",
         "\"It's dark outside, so watch your step on the way home!\" \"Thanks, I will!\""),
        ("「季節の変わり目は体調を崩しやすいので、風邪を引かないように気をつける。」",
         "\"Kisetsu no kawarime wa taichō o kuzushiyasui node, kaze o hikanai yō ni ki o tsukeru.\"",
         "\"Karena pergantian musim rawan membuat badan drop, saya berhati-hati agar tidak masuk angin.\"",
         "\"Since it is easy to fall ill during seasonal transitions, I take care not to catch a cold.\"")
    ),
    "関西": (
        ("「関西に旅行に行くなら、どこがおすすめ？」「京都の寺院と大阪のグルメが最高だよ！」",
         "\"Kansai ni ryokō ni iku nara, doko ga osusume?\" \"Kyōto no jiin to Ōsaka no gurume ga saikō da yo!\"",
         "\"Kalau mau jalan-jalan ke Kansai, tempat mana yang direkomendasikan?\" \"Kuil-kuil di Kyoto dan kuliner Osaka paling mantap!\"",
         "\"If I travel to Kansai, where do you recommend?\" \"Kyoto's temples and Osaka's food culture are the best!\""),
        ("「彼は関西出身なので、親しい仲間と話すときは自然に関西弁になる。」",
         "\"Kare wa Kansai shusshin nano de, shitashii nakama to hanasu toki wa shizen ni Kansai-ben ni naru.\"",
         "\"Karena berasal dari Kansai, saat mengobrol dengan kawan dekat logat Kansai-nya keluar secara alami.\"",
         "\"Since he is from Kansai, he naturally speaks in Kansai dialect when talking with close friends.\"")
    ),
    "ダム": (
        ("「あの巨大なダム、上から見下ろすとすごい迫力だね！」「観光用の放流も見られるらしいよ。」",
         "\"Ano kyodai na damu, ue kara miorosu to sugoi hakuryoku da ne!\" \"Kankō-yō no hōryū mo mirareru rashii yo.\"",
         "\"Bendungan raksasa itu kalau dilihat dari atas luar biasa megahnya ya!\" \"Kabarnya kita juga bisa melihat pelepasan air untuk wisata lho.\"",
         "\"Looking down from atop that huge dam is so thrilling!\" \"Apparently, you can even watch the sightseeing water release.\""),
        ("「台風による洪水を防ぐため、事前にダムの水位を下げて調整した。」",
         "\"Taifū ni yoru kōzui o fusegu tame, jizen ni damu no sui'i o sagete chōsei shita.\"",
         "\"Demi mencegah banjir akibat taifun, permukaan air bendungan telah diturunkan dan disesuaikan terlebih dahulu.\"",
         "\"To prevent flooding caused by the typhoon, the dam's water level was adjusted downward in advance.\"")
    ),
    "年度": (
        ("「新年度の予算案、無事に承認されたそうですね。」「ええ、これで来期からの新規事業も進められます。」",
         "\"Shin-nendo no yosan'an, buji ni shōnin sareta sō desu ne.\" \"Ee, kore de raiki kara no shinki jigyō mo susumeraremasu.\"",
         "\"Rancangan anggaran tahun ajaran/fiskal baru kabarnya disetujui dengan lancar ya.\" \"Iya, dengan begini proyek baru periode depan bisa dimulai.\"",
         "\"I heard the budget plan for the new fiscal year was approved smoothly.\" \"Yes, now we can proceed with new projects next term.\""),
        ("「今年度の目標を達成できるよう、社員一丸となって取り組んでいる。」",
         "\"Konnendo no mokuhyō o tassei dekiru yō, shain ichigan to natte torikunde iru.\"",
         "\"Seluruh karyawan bersatu padu berusaha sekuat tenaga agar dapat mencapai target tahun anggaran ini.\"",
         "\"All employees are working as one team so that we can achieve this fiscal year's targets.\"")
    ),
    "強化": (
        ("「最近、社内の情報セキュリティがかなり強化されましたね。」「パスワードも定期的に変更が必要になりました。」",
         "\"Saikin, shanai no jōhō sekyuriti ga kanari kyōka saremashita ne.\" \"Pasuwādo mo teikiteki ni henkō ga hitsuyō ni narimashita.\"",
         "\"Akhir-akhir ini keamanan informasi di internal perusahaan sangat diperketat ya.\" \"Kata sandi pun kini wajib diganti secara berkala.\"",
         "\"Company information security has been strengthened considerably lately, hasn't it?\" \"Passwords now need to be changed regularly too.\""),
        ("「全国大会での優勝を目指して、チーム全体の基礎体力を強化する。」",
         "\"Zenkoku taikai de no yūshō o mezashite, chīmu zentai no kiso tairyoku o kyōka suru.\"",
         "\"Memperkuat ketahanan fisik dasar seluruh tim demi membidik gelar juara pada kejuaraan nasional.\"",
         "\"Strengthening the entire team's basic physical stamina aiming for victory at the national tournament.\"")
    ),
    "深夜": (
        ("「昨日は深夜まで残業だったの？」「うん、終電ギリギリで帰ったから今日は眠いよ。」",
         "\"Kinō wa shin'ya made zangyō datta no?\" \"Un, shūden girigiri de kaetta kara kyō wa nemui yo.\"",
         "\"Kemarin lembur sampai larut malam ya?\" \"Iya, baru pulang mepet kereta terakhir jadi hari ini mengantuk sekali.\"",
         "\"Were you working overtime late into the night yesterday?\" \"Yeah, I caught the very last train, so I'm really sleepy today.\""),
        ("「深夜に住宅街を歩くときは、近隣の迷惑にならないよう静かに通行してください。」",
         "\"Shin'ya ni jūtakugai o aruku toki wa, kinrin no meiwaku ni naranai yō shizuka ni tsūkō shite kudasai.\"",
         "\"Saat berjalan di kawasan permukiman larut malam, harap lewat dengan tenang agar tidak mengganggu warga sekitar.\"",
         "\"When walking through residential neighborhoods late at night, please pass quietly so as not to disturb neighbors.\"")
    ),
    "温泉": (
        ("「週末に露天風呂のある温泉に行かない？」「いいね！日頃の疲れを癒やそう。」",
         "\"Shūmatsu ni rotenburo no aru onsen ni ikanai?\" \"Ii ne! Higoro no tsukare o iyasō.\"",
         "\"Mau pergi ke onsen yang ada kolam air panas terbukanya akhir pekan ini?\" \"Boleh banget! Ayo segarkan kepenatan sehari-hari.\"",
         "\"Want to go to a hot spring with an open-air bath this weekend?\" \"Sounds great! Let's soothe our daily fatigue.\""),
        ("「日本各地には、長い歴史を持つ有名な温泉地が数多く存在している。」",
         "\"Nihon kakuchi ni wa, nagai rekishi o motsu yūmei na onsenchi ga kazuōku sonzai shite iru.\"",
         "\"Di berbagai pelosok Jepang terdapat banyak kawasan mata air panas terkenal yang memiliki sejarah panjang.\"",
         "\"Across Japan, there are numerous famous hot spring towns with rich historical heritage.\"")
    ),
    "感想": (
        ("「さっきの映画、どうだった？感想を聞かせて！」「最後のどんでん返しがすごく面白かったよ！」",
         "\"Sakki no eiga, dō datta? Kansō o kikasete!\" \"Saigo no dondengaeshi ga sugoku omoshirokatta yo!\"",
         "\"Film tadi gimana? Ceritakan kesanmu dong!\" \"Plot twist di bagian akhirnya seru banget!\"",
         "\"How was the movie earlier? Tell me your thoughts!\" \"The plot twist at the end was absolutely thrilling!\""),
        ("「読書感想文の提出締め切りは、来週の月曜日の午前中までとなっています。」",
         "\"Dokusho kansōbun no teishutsu shimekiri wa, raishū no getsuyōbi no gozenchū made to natte imasu.\"",
         "\"Batas pengumpulan esai ulasan membaca adalah sampai Senin depan sebelum siang.\"",
         "\"The submission deadline for the book review essay is by Monday morning next week.\"")
    ),
    "物指": (
        ("「すいません、机の上の物指を貸してもらえますか？」「どうぞ、30センチのでいいですか？」",
         "\"Suimasen, tsukue no ue no monosashi o kashite moraemasu ka?\" \"Dōzo, sanjū-senti no de ii desu ka?\"",
         "\"Permisi, bisakah saya meminjam penggaris di atas meja?\" \"Silakan, yang 30 cm cukup kan?\"",
         "\"Excuse me, could you lend me the ruler on the desk?\" \"Here you go, is the 30-centimeter one okay?\""),
        ("「学歴や収入だけを人間の価値を測る物指にしてはならない。」",
         "\"Gakureki ya shūnyū dake o ningen no kachi o hakaru monosashi ni shite wa naranai.\"",
         "\"Kita tidak boleh menjadikan riwayat pendidikan atau penghasilan semata sebagai tolak ukur nilai seseorang.\"",
         "\"One must not use only educational background and income as a yardstick to measure a person's worth.\"")
    ),
    "熱する": (
        ("「フライパンをしっかり熱してから油を入れると、肉がくっつかないよ。」「へえ、なるほど！」",
         "\"Furaipan o shikkari nesshite kara abura o ireru to, niku ga kuttsukanai yo.\" \"Hē, naruhodo!\"",
         "\"Kalau wajan dipanaskan sampai benar-benar panas dulu baru diberi minyak, dagingnya tidak akan lengket lho.\" \"Wah, begitu ya!\"",
         "\"If you heat the pan thoroughly before adding oil, the meat won't stick.\" \"Oh, I see!\""),
        ("「両者の議論が熱するあまり、予定の終了時間を大幅に過ぎてしまった。」",
         "\"Ryōsha no giron ga nessuru amari, yotei no shūryō jikan o oohaba ni sugite shimatta.\"",
         "\"Karena perdebatan kedua pihak semakin panas, waktu rapat terlewat jauh dari rencana awal.\"",
         "\"Because the debate between both sides grew so heated, the meeting ran well past the scheduled end time.\"")
    ),
    "資料": (
        ("「プレゼンの資料、チェックしていただけますか？」「分かりやすくまとまっていて、とても見やすいね。」",
         "\"Purezen no shiryō, chekku shite itadakemasu ka?\" \"Wakariyasuku matomatte ite, totemo miyasui ne.\"",
         "\"Bisakah tolong periksa berkas materi presentasi saya?\" \"Tersusun ringkas dan sangat nyaman dibaca ya.\"",
         "\"Could you check my presentation slides?\" \"They are organized clearly and very easy to follow.\""),
        ("「論文を執筆するために、図書館で貴重な歴史資料を閲覧した。」",
         "\"Ronbun o shippitsu suru tame ni, toshokan de kichō na rekishi shiryō o etsuran shita.\"",
         "\"Membaca dokumen sejarah berharga di perpustakaan guna menulis karya ilmiah/skripsi.\"",
         "\"To write the academic paper, I consulted valuable historical documents in the library.\"")
    ),
    "自然科学": (
        ("「大学では何を専攻しているの？」「自然科学の物理学を中心に研究しているよ。」",
         "\"Daigaku de wa nani o senkō shite iru no?\" \"Shizen kagaku no butsuri-gaku o chūshin ni kenkyū shite iru yo.\"",
         "\"Di kampus ambil jurusan apa?\" \"Fokus meneliti ilmu pengetahuan alam khususnya fisika.\"",
         "\"What is your major at university?\" \"I'm researching natural sciences, mainly physics.\""),
        ("「自然科学の実験を通して、身の回りの現象の仕組みを論理的に解き明かす。」",
         "\"Shizen kagaku no jikken o tōshite, mi no mawari no genshō no shikumi o ronriteki ni tokiakasu.\"",
         "\"Menyingkap mekanisme fenomena di sekitar kita secara logis melalui eksperimen sains alam.\"",
         "\"Unraveling the mechanisms of everyday phenomena logically through natural science experiments.\"")
    ),
    "接続": (
        ("「すみません、Wi-Fiの接続がうまくいかないのですが。」「こちらのパスワードをもう一度入力してみてください。」",
         "\"Sumimasen, Waifai no setsuzoku ga umaku ikanai no desu ga.\" \"Kochira no pasuwādo o mō ichido nyūryoku shite mite kudasai.\"",
         "\"Permisi, koneksi Wi-Fi saya tidak tersambung dengan baik.\" \"Coba masukkan kata sandi yang ini sekali lagi ya.\"",
         "\"Excuse me, I'm having trouble connecting to the Wi-Fi.\" \"Please try entering this password one more time.\""),
        ("「外部モニターとノートパソコンをHDMIケーブルで接続して画面を拡張する。」",
         "\"Gaibu monitā to nōtopasokon o HDMI kēburu de setsuzoku shite gamen o kakuchō suru.\"",
         "\"Menghubungkan monitor eksternal dan laptop dengan kabel HDMI untuk memperluas layar kerja.\"",
         "\"Connect an external monitor to the laptop with an HDMI cable to extend the display.\"")
    )
}

# Rich varied conversational frames for Ex 1
CONVERSATION_FRAMES = [
    # 0: Inquiring / polite question
    ("「すみません、こちらの{word}について教えていただけますか？」「はい、喜んでご案内いたします。」",
     "\"Sumimasen, kochira no {ro} ni tsuite oshiete itadakemasu ka?\" \"Hai, yorokonde go-annai itashimasu.\"",
     "\"Permisi, bisakah Anda menjelaskan tentang {id} yang ini?\" \"Ya, dengan senang hati saya jelaskan.\"",
     "\"Excuse me, could you tell me about this {en}?\" \"Yes, I would be happy to explain.\""),
    # 1: Asking opinion
    ("「今回の{word}について、どう思われますか？」「非常に前向きで良い取り組みだと思います。」",
     "\"Konkai no {ro} ni tsuite, dō omowaremasu ka?\" \"Hijō ni maemuki de yoi torikumi da to omoimasu.\"",
     "\"Bagaimana pendapat Anda mengenai {id} kali ini?\" \"Menurut saya ini inisiatif yang sangat positif dan bagus.\"",
     "\"What do you think about this {en}?\" \"I think it is a very positive and great initiative.\""),
    # 2: Requesting confirmation
    ("「明日の打ち合わせの前に、{word}の件を確認していただけますか？」「承知いたしました。すぐに見ておきます。」",
     "\"Ashita no uchiawase no mae ni, {ro} no ken o kakunin shite itadakemasu ka?\" \"Shōchi itashimashita. Sugu ni mite okimasu.\"",
     "\"Sebelum rapat besok, bisakah Anda memeriksa perihal {id}?\" \"Baik, segera saya cek.\"",
     "\"Could you check the matter regarding the {en} before tomorrow's meeting?\" \"Understood. I will look over it right away.\""),
    # 3: Sharing daily experience
    ("「最近、新しい{word}を試してみたんだ。」「そうなんだ！使い心地はどうだった？」",
     "\"Saikin, atarashii {ro} o tameshite mita n da.\" \"Sō nan da! Tsukaigokochi wa dō datta?\"",
     "\"Baru-baru ini aku mencoba {id} yang baru lho.\" \"Oh ya? Gimana kenyamanan pakainya?\"",
     "\"Lately, I tried out a new {en}.\" \"Really! How was it to use?\""),
    # 4: Friendly invitation / plan
    ("「週末に{word}のイベントがあるんだけど、一緒に行かない？」「いいね、ぜひ参加したい！」",
     "\"Shūmatsu ni {ro} no ibento ga aru n da kedo, issho ni ikanai?\" \"Ii ne, zehi sanka shitai!\"",
     "\"Akhir pekan ini ada acara {id}, mau pergi bareng nggak?\" \"Boleh banget, aku mau ikut!\"",
     "\"There's an event for {en} this weekend, want to go together?\" \"Sounds great, I'd love to join!\""),
    # 5: Workplace status inquiry
    ("「{word}の準備は順調に進んでいますか？」「はい、予定通り進んでおりますのでご安心ください。」",
     "\"\"{ro} no junbi wa junchō ni susunde imasu ka?\" \"Hai, yotei-dōri susunde orimasu node go-anshin kudasai.\"",
     "\"Apakah persiapan {id} berjalan lancar?\" \"Ya, berjalan sesuai rencana jadi jangan khawatir.\"",
     "\"Are the preparations for the {en} going smoothly?\" \"Yes, everything is on schedule, so please don't worry.\""),
    # 6: Polite suggestion / recommendation
    ("「もし困ったときは、こちらの{word}を利用すると便利ですよ。」「助かります、試してみますね。」",
     "\"Moshi komatta toki wa, kochira no {ro} o riyō suru to benri desu yo.\" \"Tasukarimasu, tameshite mimasu ne.\"",
     "\"Jika merasa kesulitan, menggunakan {id} yang ini sangat praktis lho.\" \"Sangat membantu, akan saya coba ya.\"",
     "\"If you have any trouble, using this {en} is very convenient.\" \"That helps a lot, I'll give it a try.\""),
    # 7: Asking location / availability
    ("「この近くに{word}を取り扱っている場所はありますか？」「ええ、角を曲がったところにございます。」",
     "\"Kono chikaku ni {ro} o toriatsukatte iru basho wa arimasu ka?\" \"Ee, kado o magatta tokoro ni gozaimasu.\"",
     "\"Apakah di dekat sini ada tempat yang menyediakan {id}?\" \"Ya, ada tepat setelah belokan di pojok itu.\"",
     "\"Is there any place nearby that handles {en}?\" \"Yes, there is one just around the corner.\""),
]

# Varied situational frames for Ex 2 (JLPT reading & practical sentences)
SITUATIONAL_FRAMES = [
    # 0: Cause & Effect / Social change
    ("社会の急速な変化に伴い、{word}のあり方が見直されている。",
     "Shakai no kyūsoku na henka ni tomonai, {ro} no arikata ga minaosarete iru.",
     "Seiring perubahan pesat dalam masyarakat, cara pengelolaan {id} mulai ditinjau kembali.",
     "With rapid changes in society, the role of {en} is being reconsidered."),
    # 1: Importance & Deep understanding
    ("将来の目標を達成する上で、{word}の重要性を深く認識する必要がある。",
     "Shōrai no mokuhyō o tassei suru ue de, {ro} no jūyōsei o fukaku ninshiki suru hitsuyō ga aru.",
     "Dalam mencapai tujuan masa depan, perlu menyadari secara mendalam betapa pentingnya {id}.",
     "In achieving future goals, it is essential to deeply recognize the importance of {en}."),
    # 2: Quality & Standards
    ("専門家の綿密な調査によって、{word}の正確な実態が明らかになった。",
     "Senmonka no menmitsu na chōsa ni yotte, {ro} no seikaku na jittai ga akiraka ni natta.",
     "Melalui penyelidikan saksama para ahli, kondisi nyata dari {id} menjadi jelas.",
     "Through meticulous investigation by experts, the true state of {en} has become clear."),
    # 3: Daily mindfulness / Habit
    ("安心で快適な生活を維持するために、日頃から{word}を適切に心がける。",
     "Anshin de kaiteki na seikatsu o iji suru tame ni, higoro kara {ro} o tekisetsu ni kokorogakeru.",
     "Demi menjaga kehidupan yang aman dan nyaman, senantiasa memperhatikan {id} dengan baik sehari-hari.",
     "To maintain a safe and comfortable life, one should always pay proper attention to {en}."),
    # 4: Official announcement / Guideline
    ("利用者の安全を最優先に考え、{word}に関するガイドラインを改定した。",
     "Riyōsha no anzen o saiyūsen ni kangae, {ro} ni kansuru gaidorain o kaitei shita.",
     "Memprioritaskan keselamatan pengguna, pedoman terkait {id} telah diperbarui.",
     "Placing top priority on user safety, the guidelines concerning {en} have been revised."),
    # 5: Teamwork / Execution
    ("プロジェクトの成功に向けて、チーム全体で{word}の管理を徹底している。",
     "Purojekuto no seikō ni mukete, chīmu zentai de {ro} no kanri o tettei shite iru.",
     "Menuju keberhasilan proyek, seluruh tim secara tuntas mengelola {id}.",
     "Aiming for project success, the whole team thoroughly manages the {en}."),
]

def generate_natural_entry_examples(word, reading_kana, en_meaning, id_meaning, index):
    read_ro = kana_to_romaji(reading_kana)
    if not read_ro:
        read_ro = kana_to_romaji(word)
    
    # Primary meaning extraction
    id_primary = id_meaning.split(',')[0].split('/')[0].strip()
    if not id_primary:
        id_primary = "hal ini"

    en_primary = en_meaning.split(',')[0].split('/')[0].strip()
    if en_primary.startswith('to '):
        en_clean = en_primary[3:]
    else:
        en_clean = en_primary
    if not en_clean:
        en_clean = "this"

    c_idx = index % len(CONVERSATION_FRAMES)
    cf = CONVERSATION_FRAMES[c_idx]

    ex1_jp = cf[0].format(word=word, ro=read_ro, id=id_primary, en=en_clean)
    ex1_ro = cf[1].format(word=word, ro=read_ro, id=id_primary, en=en_clean)
    ex1_id = cf[2].format(word=word, ro=read_ro, id=id_primary, en=en_clean)
    ex1_en = cf[3].format(word=word, ro=read_ro, id=id_primary, en=en_clean)

    s_idx = (index + 2) % len(SITUATIONAL_FRAMES)
    sf = SITUATIONAL_FRAMES[s_idx]

    ex2_jp = sf[0].format(word=word, ro=read_ro, id=id_primary, en=en_clean)
    ex2_ro = sf[1].format(word=word, ro=read_ro, id=id_primary, en=en_clean)
    ex2_id = sf[2].format(word=word, ro=read_ro, id=id_primary, en=en_clean)
    ex2_en = sf[3].format(word=word, ro=read_ro, id=id_primary, en=en_clean)

    return (
        (ex1_jp, ex1_ro, ex1_id, ex1_en),
        (ex2_jp, ex2_ro, ex2_id, ex2_en)
    )

def update_all():
    # 1. Update mazii.js
    input_path = 'src/data/mazii.js'
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'\[\s*\"(.*?)\"\s*,\s*\"(.*?)\"\s*,\s*\"(.*?)\"\s*,\s*\"(.*?)\"(?:,.*?)?\]')
    matches = list(pattern.finditer(content))
    print(f"Found {len(matches)} raw entries in {input_path}")

    # Build lookup from CORE_VOCAB_FULL
    core_dict = {row[0]: row for row in CORE_VOCAB_FULL}

    processed_rows = []
    idx = 0
    for m in matches:
        kanji = m.group(1).strip()
        kana = m.group(2).strip()
        english = m.group(3).strip()
        indonesian = m.group(4).strip()

        if kanji == 'kanji':
            continue

        reading_kana = clean_word_reading(kanji, kana)

        if kanji in core_dict:
            row = core_dict[kanji]
        elif kanji in CURATED_EXAMPLES_MAZII:
            ex1, ex2 = CURATED_EXAMPLES_MAZII[kanji]
            row = [
                kanji, kana, english, indonesian,
                ex1[0], ex1[1], ex1[2],
                ex2[0], ex2[1], ex2[2],
                ex1[3], ex2[3]
            ]
        else:
            ex1, ex2 = generate_natural_entry_examples(kanji, reading_kana, english, indonesian, idx)
            row = [
                kanji, kana, english, indonesian,
                ex1[0], ex1[1], ex1[2],
                ex2[0], ex2[1], ex2[2],
                ex1[3], ex2[3]
            ]

        processed_rows.append(row)
        idx += 1

    lines = [
        "export const maziiData = [",
        "  // meaning -> [\"kanji\", \"kana\", \"english\", \"indonesian\", \"ex1_jp\", \"ex1_romaji\", \"ex1_id\", \"ex2_jp\", \"ex2_romaji\", \"ex2_id\", \"ex1_en\", \"ex2_en\"]"
    ]
    for r in processed_rows:
        row_json = json.dumps(r, ensure_ascii=False)
        lines.append(f"  {row_json},")
    lines.append("];")
    lines.append("")

    with open(input_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"Updated {input_path} with {len(processed_rows)} entries (all 12 elements).")

    # 2. Update vocab.js with all 20 CORE_VOCAB_FULL entries
    vocab_path = 'src/data/vocab.js'
    v_lines = [
        "import { maziiData } from './mazii.js';",
        "",
        "const coreVocab = ["
    ]
    for r in CORE_VOCAB_FULL:
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
    print(f"Updated {vocab_path} with all {len(CORE_VOCAB_FULL)} coreVocab entries and combined export.")

if __name__ == '__main__':
    update_all()
