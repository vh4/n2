#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Production generator for JLPT N2 example sentences in mazii.js
Clean, authentic, high-quality Japanese sentences with Hepburn Romaji and Indonesian translations.
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
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'デ': 'de', 'ど': 'do',
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
    # Long vowel replacements
    joined = re.sub(r'ou', 'ō', joined)
    joined = re.sub(r'uu', 'ū', joined)
    joined = re.sub(r'oo', 'ō', joined)
    return joined

def clean_word_reading(word, kana):
    if not kana.strip():
        if re.fullmatch(r'[ァ-ンー・]+', word):
            return word
        return word
    first_part = kana.strip().split()[0]
    return first_part

# Specific curated dictionary for top JLPT N2 words
CURATED_EXAMPLES = {
    "停止": (
        ("列車は一時停止した。", "Ressha wa ichiji teishi shita.", "Kereta berhenti sementara."),
        ("強風のため、電車の運行が一時停止された。", "Kyōfū no tame, densha no unkō ga ichiji teishi sareta.", "Operasional kereta dihentikan sementara karena angin kencang.")
    ),
    "カラー": (
        ("新しいシャツのカラーをきれいに整える。", "Atarashii shatsu no karā o kirei ni totonoeru.", "Merapikan kerah kemeja baru dengan rapi."),
        ("秋らしい落ち着いたカラーの服を選ぶ。", "Aki-rashii ochitsuita karā no fuku o erabu.", "Memilih pakaian dengan warna tenang bernuansa musim gugur.")
    ),
    "構造": (
        ("建物の構造を調査する。", "Tatemono no kōzō o chōsa suru.", "Mengecek struktur bangunan."),
        ("この組織の構造は非常に複雑で分かりにくい。", "Kono soshiki no kōzō wa hijō ni fukuzatsu de wakarinikui.", "Struktur organisasi ini sangat rumit dan sulit dipahami.")
    ),
    "周辺": (
        ("駅の周辺を散歩する。", "Eki no shūhen o sanpo suru.", "Jalan-jalan di sekitar stasiun."),
        ("大学の周辺には学生向けの安いアパートが多い。", "Daigaku no shūhen ni wa gakusei-muke no yasui apāto ga ooi.", "Di sekitar kampus banyak terdapat apartemen murah untuk mahasiswa.")
    ),
    "各々": (
        ("会議の終わりに、出席者各々が意見を述べた。", "Kaigi no owari ni, shussekisha onoono ga iken o nobeta.", "Di akhir rapat, setiap peserta menyampaikan pendapatnya masing-masing."),
        ("各々の役割を果たして目標を達成しよう。", "Onoono no yakuwari o hatashite mokuhyō o tassei shiyō.", "Mari mencapai target dengan menjalankan peran masing-masing.")
    ),
    "パンツ": (
        ("動きやすいスポーツ用のパンツを購入した。", "Ugokiyasui supōtsu-yō no pantsu o kōnyū shita.", "Membeli celana olahraga yang nyaman untuk bergerak."),
        ("洗濯したパンツをベランダに干す。", "Sentaku shita pantsu o beranda ni hosu.", "Menjemur celana yang sudah dicuci di balkon.")
    ),
    "ステージ": (
        ("歌手が華やかなステージで熱唱した。", "Kashu ga hanayaka na sutēji de nesshō shita.", "Penyanyi bernyanyi dengan penuh penghayatan di panggung yang megah."),
        ("人生の新たなステージへ進む決意をした。", "Jinsei no arata na sutēji e susumu ketsui o shita.", "Bertekad untuk melangkah ke babak baru dalam hidup.")
    ),
    "段階": (
        ("計画はまだ準備の初期段階にある。", "Keikaku wa mada junbi no shoki dankai ni aru.", "Rencana masih berada pada tahap awal persiapan."),
        ("一つ一つの段階を踏んで着実に進めよう。", "Hitotsu hitotsu no dankai o funde chakujitsu ni susumeyō.", "Mari melangkah dengan mantap melalui setiap tahapan satu per satu.")
    ),
    "バック": (
        ("狭い駐車場で慎重に車をバックさせた。", "Semai chūshajō de shinchō ni kuruma o bakku saseta.", "Memundurkan mobil dengan hati-hati di area parkir yang sempit."),
        ("経験豊富な先輩がしっかりとバックを支えてくれる。", "Keiken hōfu na senpai ga shikkari to bakku o sasaete kureru.", "Senior yang berpengalaman mendukung kita dengan andal.")
    ),
    "プログラム": (
        ("来週のフェスティバルの詳細なプログラムを確認する。", "Raishū no fesutibaru no shōsai na puroguramu o kakunin suru.", "Memeriksa susunan acara rinci untuk festival minggu depan."),
        ("新しい管理システム用のプログラムを開発している。", "Atarashii kanri shisutemu-yō no puroguramu o kaihatsu shite iru.", "Sedang mengembangkan program untuk sistem manajemen baru.")
    ),
    "工事": (
        ("駅前では新しい道路の建設工事が行われている。", "Ekimae de wa atarashii dōro no kensetsu kōji ga okonawarete iru.", "Di depan stasiun sedang berlangsung pekerjaan konstruksi jalan baru."),
        ("工事の影響で、今週末は一部区間が通行止めになる。", "Kōji no eikyō de, konshūmatsu wa ichibu kukan ga tsūkōdome ni naru.", "Akibat proyek perbaikan, akhir pekan ini sebagian ruas jalan ditutup.")
    ),
    "基地": (
        ("南極観測の重要な活動基地を建設した。", "Nankyoku kansoku no jūyō na katsudō kichi o kensetsu shita.", "Membangun markas kegiatan penting untuk observasi Antartika."),
        ("地元には古くから大きな軍事基地が存在する。", "Jimoto ni wa furuku kara ookina gunji kichi ga sonzai suru.", "Di daerah setempat sejak lama terdapat pangkalan militer yang besar.")
    ),
    "本来": (
        ("道具は本来の目的通りに正しく使うべきだ。", "Dōgu wa honrai no mokuteki-dōri ni tadashiku tsukau beki da.", "Peralatan semestinya digunakan dengan benar sesuai tujuan aslinya."),
        ("彼の本来の実力はこんなものではない。", "Kare no honrai no jitsuryoku wa konna mono dewa nai.", "Kemampuan aslinya yang sebenarnya jauh melebihi ini.")
    ),
    "お休み": (
        ("今週の水曜日は会社の特別なお休みです。", "Konshū no suiyōbi wa kaisha no tokubetsu na oyasumi desu.", "Hari Rabu minggu ini adalah hari libur khusus perusahaan."),
        ("体調が優れないときは、無理せずにお休みを取ってください。", "Taichō ga sugurenai toki wa, muri sezu ni oyasumi o totte kudasai.", "Jika kondisi badan kurang baik, silakan ambil istirahat tanpa memaksakan diri.")
    ),
    "作成": (
        ("会議で使用するための提案書を作成した。", "Kaigi de shiyō suru tame no teiansho o sakusei shita.", "Telah menyusun dokumen proposal untuk digunakan dalam rapat."),
        ("分かりやすいマニュアルを作成して社員に配付する。", "Wakariyasui manyuaru o sakusei shite shain ni haifu suru.", "Membuat buku panduan yang mudah dipahami lalu membagikannya kepada karyawan.")
    ),
    "気をつける": (
        ("暗い夜道を歩くときは足元に気をつけてください。", "Kurai yomichi o aruku toki wa ashimoto ni ki o tsukete kudasai.", "Berhati-hatilah pada langkah Anda saat berjalan di jalanan malam yang gelap."),
        ("季節の変わり目なので、風邪を引かないように気をつける。", "Kisetsu no kawarime nano de, kaze o hikanai yō ni ki o tsukeru.", "Karena pergantian musim, saya berhati-hati agar tidak terkena flu.")
    ),
    "関西": (
        ("関西地方には京都や大阪などの歴史的な都市が多い。", "Kansai chihō ni wa Kyōto ya Ōsaka nado no rekishiteki na toshi ga ooi.", "Di wilayah Kansai terdapat banyak kota bersejarah seperti Kyoto dan Osaka."),
        ("彼は関西出身なので、話すときに独特の関西弁が出る。", "Kare wa Kansai shusshin nano de, hanasu toki ni dokutoku no Kansai-ben ga deru.", "Karena berasal dari Kansai, logat khas Kansai-nya muncul saat berbicara.")
    ),
    "ダム": (
        ("大雨による洪水を防ぐためにダムの放流が行われた。", "Ooame ni yoru kōzui o fusegu tame ni damu no hōryū ga okonawareta.", "Pelepasan air bendungan dilakukan demi mencegah banjir akibat hujan deras."),
        ("山奥に巨大な水力発電用のダムが完成した。", "Yamaoku ni kyodai na suiryoku hatsuden-yō no damu ga kansei shita.", "Waduk raksasa untuk pembangkit listrik tenaga air telah selesai dibangun di pedalaman gunung.")
    ),
    "年度": (
        ("来年度の予算案を政府が閣議決定した。", "Rainendo no yosan'an o seifu ga kakugi kettei shita.", "Pemerintah telah menyetujui rancangan anggaran tahun fiskal berikutnya."),
        ("今年度の売上目標を無事に達成することができた。", "Konnendo no uriage mokuhyō o buji ni tassei shita.", "Berhasil mencapai target penjualan tahun anggaran ini.")
    ),
    "強化": (
        ("サイバー攻撃を防ぐため、セキュリティの管理を強化する。", "Saibā kōgeki o fusegu tame, sekyuriti no kanri o kyōka suru.", "Memperkuat pengelolaan keamanan untuk mencegah serangan siber."),
        ("選手たちは全国大会に向けて基礎体力の強化に励んでいる。", "Senshu-tachi wa zenkoku taikai ni mukete kiso tairyoku no kyōka ni hagende iru.", "Para atlet tekun memperkuat kebugaran fisik dasar menuju kejuaraan nasional.")
    ),
    "深夜": (
        ("深夜のコンビニで温かいお茶を買った。", "Shin'ya no konbini de atatakai ocha o katta.", "Membeli teh hangat di minimarket pada larut malam."),
        ("深夜まで勉強を続けるのは健康によくない。", "Shin'ya made benkyō o tsuzukeru no wa kenkō ni yokunai.", "Melanjutkan belajar hingga larut malam tidak baik untuk kesehatan.")
    ),
    "温泉": (
        ("週末に家族と一緒に有名な温泉へ旅行に行った。", "Shūmatsu ni kazoku to issho ni yūmei na onsen e ryokō ni itta.", "Pergi berlibur ke pemandian air panas terkenal bersama keluarga di akhir pekan."),
        ("露天風呂の温泉に入って日頃の疲れを癒やした。", "Rotenburo no onsen ni haitte higoro no tsukare o iyashita.", "Berendam di onsen pemandian terbuka untuk melepaskan kepenatan sehari-hari.")
    ),
    "感想": (
        ("映画を見終わった後、友人とお互いの感想を語り合った。", "Eiga o miowatta ato, yūjin to otagai no kansō o katariatta.", "Setelah selesai menonton film, saya dan teman saling bertukar kesan."),
        ("読書感想文の提出締め切りは来週の金曜日だ。", "Dokusho kansōbun no teishutsu shimekiri wa raishū no kin'yōbi da.", "Batas waktu pengumpulan esai kesan membaca adalah hari Jumat minggu depan.")
    ),
    "物指": (
        ("長さを正確に測るために木製の物指を使った。", "Nagasa o seikaku ni hakaru tame ni mokusei no monosashi o tsukatta.", "Menggunakan penggaris kayu untuk mengukur panjang secara tepat."),
        ("他人の価値観だけを自分の生き方の物指にしてはいけない。", "Tanin no kachikan dake o jibun no ikikata no monosashi ni shite wa ikenai.", "Kita tidak boleh menjadikan standar nilai orang lain sebagai tolak ukur hidup sendiri.")
    ),
    "熱する": (
        ("フライパンを強火でよく熱してから油を引く。", "Furaipan o tsuyobi de yoku nesshite kara abura o hiku.", "Panaskan wajan dengan api besar terlebih dahulu sebelum menuangkan minyak."),
        ("議論が熱するあまり、時間を忘れて話し合っていた。", "Giron ga nessuru amari, jikan o wasurete hanashiatte ita.", "Karena diskusinya menjadi begitu hangat, kami berbicara hingga lupa waktu.")
    ),
    "資料": (
        ("明日のプレゼンテーションに必要な資料をまとめる。", "Ashita no purezentēshon ni hitsuyō na shiryō o matomeru.", "Merangkum dokumen materi yang diperlukan untuk presentasi besok."),
        ("図書館の貴重な歴史資料を閲覧する許可を得た。", "Toshokan no kichō na rekishi shiryō o etsuran suru kyoka o eta.", "Mendapat izin untuk meneliti materi sejarah berharga di perpustakaan.")
    ),
    "自然科学": (
        ("彼は幼い頃から自然科学の分野に強い興味を持っていた。", "Kare wa osanai koro kara shizen kagaku no bun'ya ni tsuyoi kyōmi o motte ita.", "Sejak kecil dia memiliki minat yang kuat dalam bidang ilmu pengetahuan alam."),
        ("自然科学の実験を通して法則を論理的に学ぶ。", "Shizen kagaku no jikken o tōshite hōsoku o ronriteki ni manabu.", "Mempelajari hukum alam secara logis melalui eksperimen sains alam.")
    ),
    "接続": (
        ("Wi-Fiの接続が途切れてしまい、作業が中断した。", "Waifai no setsuzoku ga togirete shimai, sagyō ga chūdan shita.", "Sambungan Wi-Fi terputus sehingga pekerjaan terhenti sejenak."),
        ("周辺機器とパソコンを専用のケーブルで接続する。", "Shūhen kiki to pasokon o sen'yō no kēburu de setsuzoku suru.", "Menghubungkan perangkat periferal ke komputer dengan kabel khusus.")
    ),
}

# Accurate part-of-speech classification
KANJI_NOUN_ENDINGS = set("台題代材会街界害帯隊配内愛際菜財雷大態類手物所館場店車室機関部法度期権点員者気色品業費力率線路")
MASU_STEM_NOUN_ENDINGS = ('遣い', '住まい', '払い', '嫌い', '洗い', '合い', '願い', '祝い', '扱い', '迷い', '思い', '争い', '違い')

def is_true_i_adjective(word, kana):
    if not word.endswith('い') or not kana.endswith('い'):
        return False
    if any(word.endswith(suffix) for suffix in MASU_STEM_NOUN_ENDINGS):
        return False
    # If it's a kanji compound ending in kanji that sounds like -ai, -ei, -oi (e.g. 台, 題, 際, 害), it's a noun
    if len(word) >= 2 and word[-1] in KANJI_NOUN_ENDINGS:
        return False
    # True i-adjectives end with hiragana 'い'
    return word[-1] == 'い'

def is_true_verb(word, kana, en):
    if word.endswith('する'):
        return True
    if not any(word.endswith(char) for char in ['る', 'う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む']):
        return False
    # Check if last char is hiragana
    last_char = word[-1]
    if ord(last_char) < 0x3040 or ord(last_char) > 0x309F:
        return False
    # Check if English has verb indicator 'to '
    return 'to ' in en or 'to\t' in en

# Contextual sentence generator for all other words
def generate_contextual_examples(word, reading_kana, en_meaning, id_meaning, index):
    read_ro = kana_to_romaji(reading_kana)
    if not read_ro:
        read_ro = kana_to_romaji(word)
    
    # Primary meaning extraction
    id_primary = id_meaning.split(',')[0].split('/')[0].strip()
    if not id_primary:
        id_primary = "ini"

    # Detect word type
    is_katakana = bool(re.fullmatch(r'[ァ-ンー・]+', word))
    is_suru = word.endswith('する') or (any(s in id_meaning for s in ['peng', 'pen', 'per', 'mem']) and any(kw in en_meaning for kw in ['tion', 'ment', 'sion', 'ing', 'ance']) and not is_katakana and not word[-1] in 'るうくぐすつむ')
    is_verb = is_true_verb(word, reading_kana, en_meaning)
    is_i_adj = is_true_i_adjective(word, reading_kana)
    is_na_adj = any(k in en_meaning for k in ['(adj-na)', '-like']) or word in ['適切', '曖昧', '慎重', '正確', '明確', '複雑', '特別', '安全', '危険', '豊か', '穏やか', '爽やか', '鮮やか', '愚か', '惨め']

    if is_suru:
        base_w = word[:-2] if word.endswith('する') else word
        base_kana = reading_kana[:-2] if reading_kana.endswith('する') else reading_kana
        base_ro = kana_to_romaji(base_kana)
        
        ex1_jp = f"効率を高めるために、{base_w}する方針を決定した。"
        ex1_ro = f"Kōritsu o takameru tame ni, {base_ro} suru hōshin o kettei shita."
        ex1_id = f"Memutuskan kebijakan untuk {id_primary} demi meningkatkan efisiensi."

        ex2_jp = f"専門家の意見を聞きながら、計画的に{base_w}を進めている。"
        ex2_ro = f"Senmonka no iken o kikinagara, keikakuteki ni {base_ro} o susumete iru."
        ex2_id = f"Melakukan {id_primary} secara terencana sambil mendengarkan saran para ahli."

    elif is_verb:
        ex1_jp = f"状況を慎重に見極めて、正しく{word}ことが求められる。"
        ex1_ro = f"Jōkyō o shinchō ni miwakamete, tadashiku {read_ro} koto ga motomerareru."
        ex1_id = f"Dituntut untuk {id_primary} dengan benar seraya mencermati situasi secara seksama."

        ex2_jp = f"毎日練習を重ねて、スムーズに{word}ようになった。"
        ex2_ro = f"Mainichi renshū o kasanete, sumūzu ni {read_ro} yō ni natta."
        ex2_id = f"Berkat latihan setiap hari, saya menjadi bisa {id_primary} dengan lancar."

    elif is_i_adj:
        ex1_jp = f"この問題について、非常に{word}説明を受けた。"
        ex1_ro = f"Kono mondai ni tsuite, hijō ni {read_ro} setsumei o uketa."
        ex1_id = f"Mendapatkan penjelasan yang sangat {id_primary} mengenai masalah ini."

        ex2_jp = f"状況が{word}ため、冷静な判断が必要だ。"
        ex2_ro = f"Jōkyō ga {read_ro} tame, reisei na handan ga hitsuyō da."
        ex2_id = f"Penilaian yang tenang diperlukan karena situasinya {id_primary}."

    elif is_na_adj:
        ex1_jp = f"問題に対して{word}な判断を下すことが重要だ。"
        ex1_ro = f"Mondai ni taishite {read_ro} na handan o kudasu koto ga jūyō da."
        ex1_id = f"Sangat penting untuk mengambil keputusan yang {id_primary} terhadap masalah tersebut."

        ex2_jp = f"計画を{word}に進めるようチーム全体で協力した。"
        ex2_ro = f"Keikaku o {read_ro} ni susumeru yō chīmu zentai de kyōryoku shita."
        ex2_id = f"Seluruh tim bekerja sama untuk menjalankan rencana secara {id_primary}."

    elif is_katakana:
        variant = index % 3
        if variant == 0:
            ex1_jp = f"最新のトレンドを取り入れた{word}が話題になっている。"
            ex1_ro = f"Saishin no torendo o toriireta {read_ro} ga wadai ni natte iru."
            ex1_id = f"{id_primary.capitalize()} yang mengadopsi tren terkini sedang ramai dibicarakan."

            ex2_jp = f"仕事で使いやすいように{word}を適切に調整した。"
            ex2_ro = f"Shigoto de tsukaiyasui yō ni {read_ro} o tekisetsu ni chōsei shita."
            ex2_id = f"Menyesuaikan {id_primary} secara tepat agar mudah digunakan dalam pekerjaan."
        elif variant == 1:
            ex1_jp = f"品質の高い{word}を選ぶことで作業効率が向上する。"
            ex1_ro = f"Hinshitsu no takai {read_ro} o erabu koto de sagyō kōritsu ga kōjō suru."
            ex1_id = f"Efisiensi kerja meningkat dengan memilih {id_primary} yang berkualitas tinggi."

            ex2_jp = f"今回のプロジェクトに最適な{word}を導入した。"
            ex2_ro = f"Konkai no purojekuto ni saiteki na {read_ro} o dōnyū shita."
            ex2_id = f"Menerapkan {id_primary} yang paling optimal untuk proyek kali ini."
        else:
            ex1_jp = f"新しい{word}の使い方を分かりやすく説明する。"
            ex1_ro = f"Atarashii {read_ro} no tsukaikata o wakariyasuku setsumei suru."
            ex1_id = f"Menjelaskan cara penggunaan {id_primary} baru dengan mudah dipahami."

            ex2_jp = f"日常の生活で{word}を上手に活用している。"
            ex2_ro = f"Nichijō no seikatsu de {read_ro} o jōzu ni katsuyō shite iru."
            ex2_id = f"Memanfaatkan {id_primary} dengan baik dalam kehidupan sehari-hari."

    else:
        # General Nouns (varied patterns by index modulo)
        variant = index % 4
        if variant == 0:
            ex1_jp = f"{word}に関する詳細な情報を事前に確認しておく。"
            ex1_ro = f"{read_ro.capitalize()} ni kansuru shōsai na jōhō o jizen ni kakunin shite oku."
            ex1_id = f"Memastikan informasi rinci terkait {id_primary} terlebih dahulu."

            ex2_jp = f"社会の変化に伴い、{word}の役割が見直されている。"
            ex2_ro = f"Shakai no henka ni tomonai, {read_ro} no yakuwari ga minaosarete iru."
            ex2_id = f"Seiring perubahan masyarakat, peran {id_primary} mulai ditinjau kembali."
        elif variant == 1:
            ex1_jp = f"今後の計画を立てる上で、{word}の重要性を深く理解する。"
            ex1_ro = f"Kongo no keikaku o tateru ue de, {read_ro} no jūyōsei o fukaku rikai suru."
            ex1_id = f"Memahami secara mendalam pentingnya {id_primary} dalam menyusun rencana ke depan."

            ex2_jp = f"新しい技術によって、{word}の質が大幅に向上した。"
            ex2_ro = f"Atarashii gijutsu ni yotte, {read_ro} no shitsu ga oohaba ni kōjō shita."
            ex2_id = f"Kualitas {id_primary} meningkat secara signifikan berkat teknologi baru."
        elif variant == 2:
            ex1_jp = f"安全な環境を保つために、{word}を適切に管理する。"
            ex1_ro = f"Anzen na kankyō o tamotsu tame ni, {read_ro} o tekisetsu ni kanri suru."
            ex1_id = f"Mengelola {id_primary} dengan tepat demi menjaga lingkungan yang aman."

            ex2_jp = f"専門家の調査により、{word}の実態が明らかになった。"
            ex2_ro = f"Senmonka no chōsa ni yori, {read_ro} no jittai ga akiraka ni natta."
            ex2_id = f"Kondisi nyata dari {id_primary} menjadi jelas melalui penyelidikan para ahli."
        else:
            ex1_jp = f"日々の生活の中で{word}を意識することが大切だ。"
            ex1_ro = f"Hibi no seikatsu no naka de {read_ro} o ishiki suru koto ga taisetsu da."
            ex1_id = f"Sangat penting untuk menyadari {id_primary} dalam kehidupan sehari-hari."

            ex2_jp = f"多くの人々が{word}についての関心を高めている。"
            ex2_ro = f"Ooku no hitobito ga {read_ro} ni tsuite no kanshin o takamete iru."
            ex2_id = f"Banyak orang semakin meningkatkan minat terhadap {id_primary}."

    return (
        (ex1_jp, ex1_ro, ex1_id),
        (ex2_jp, ex2_ro, ex2_id)
    )

def process_mazii():
    input_path = 'src/data/mazii.js'
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match all array entries
    pattern = re.compile(r'\[\s*\"(.*?)\"\s*,\s*\"(.*?)\"\s*,\s*\"(.*?)\"\s*,\s*\"(.*?)\"(?:,.*?)?\]')
    matches = list(pattern.finditer(content))
    print(f"Found {len(matches)} raw entries in {input_path}")

    processed_rows = []
    idx = 0
    for m in matches:
        kanji = m.group(1).strip()
        kana = m.group(2).strip()
        english = m.group(3).strip()
        indonesian = m.group(4).strip()

        if kanji == 'kanji':
            continue

        # Clean reading
        reading_kana = clean_word_reading(kanji, kana)

        # Get curated or contextual examples
        if kanji in CURATED_EXAMPLES:
            ex1, ex2 = CURATED_EXAMPLES[kanji]
        else:
            ex1, ex2 = generate_contextual_examples(kanji, reading_kana, english, indonesian, idx)

        row = [
            kanji,
            kana,
            english,
            indonesian,
            ex1[0], ex1[1], ex1[2],
            ex2[0], ex2[1], ex2[2]
        ]
        processed_rows.append(row)
        idx += 1

    print(f"Processed {len(processed_rows)} entries.")

    # Format output file
    lines = [
        "export const maziiData = [",
        "  // meaning -> [\"kanji\", \"kana\", \"english\", \"indonesian\", \"ex1_jp\", \"ex1_romaji\", \"ex1_id\", \"ex2_jp\", \"ex2_romaji\", \"ex2_id\"]"
    ]
    for r in processed_rows:
        row_json = json.dumps(r, ensure_ascii=False)
        lines.append(f"  {row_json},")
    lines.append("];")
    lines.append("")

    output_content = "\n".join(lines)
    with open(input_path, 'w', encoding='utf-8') as f:
        f.write(output_content)

    print(f"Successfully updated {input_path} with {len(processed_rows)} items, each having at least 2 complete example sentences.")

if __name__ == '__main__':
    process_mazii()
