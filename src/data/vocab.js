import { maziiData } from './mazii.js';

const coreVocab = [
  [
    "停止",
    "ていし",
    "suspension, stoppage",
    "penangguhan, penghentian sementara",
    "列車は一時停止した。",
    "Ressha wa ichiji teishi shita.",
    "Kereta berhenti sementara.",
    "強風のため、電車の運行が一時停止された。",
    "Kyōfū no tame, densha no unkō ga ichiji teishi sareta.",
    "Operasional kereta dihentikan sementara karena angin kencang."
  ],
  [
    "構造",
    "こうぞう",
    "structure, framework",
    "struktur, kerangka",
    "建物の構造を調査する。",
    "Tatemono no kōzō o chōsa suru.",
    "Mengecek struktur bangunan.",
    "この組織の構造は非常に複雑で分かりにくい。",
    "Kono soshiki no kōzō wa hijō ni fukuzatsu de wakarinikui.",
    "Struktur organisasi ini sangat rumit dan sulit dipahami."
  ],
  [
    "周辺",
    "しゅうへん",
    "vicinity, surroundings",
    "sekitar, lingkungan",
    "駅の周辺を散歩する。",
    "Eki no shūhen o sanpo suru.",
    "Jalan-jalan di sekitar stasiun.",
    "大学の周辺には学生向けの安いアパートが多い。",
    "Daigaku no shūhen ni wa gakusei-muke no yasui apāto ga ooi.",
    "Di sekitar kampus banyak terdapat apartemen murah untuk mahasiswa."
  ],
  [
    "体制",
    "たいせい",
    "order, system, set-up",
    "tatanan, sistem, struktur",
    "新しい体制でスタートする。",
    "Atarashii taisei de sutāto suru.",
    "Memulai dengan sistem yang baru.",
    "24時間対応できるサポート体制を整えた。",
    "Nijūyo-jikan taiō dekiru sapōto taisei o totonoeta.",
    "Telah menyiapkan sistem dukungan yang dapat melayani 24 jam."
  ],
  [
    "対象",
    "たいしょう",
    "target, object, subject",
    "sasaran, objek, target",
    "高校生を対象としたアンケート。",
    "Kōkōsei o taishō to shita ankēto.",
    "Survei yang ditujukan untuk siswa SMA.",
    "このセミナーは初心者から上級者までを対象としている。",
    "Kono seminā wa shoshinsha kara jōkyūsha made o taishō to shite iru.",
    "Seminar ini ditujukan untuk pemula hingga tingkat lanjut."
  ],
  [
    "維持",
    "いじ",
    "maintenance, preservation",
    "pemeliharaan, pemertahanan",
    "健康を維持するために運動する。",
    "Kenkō o iji suru tame ni undō suru.",
    "Berolahraga untuk menjaga kesehatan.",
    "良好な人間関係を維持するには思いやりが大切だ。",
    "Ryōkō na ningen kankei o iji suru ni wa omoiyari ga taisetsu da.",
    "Tenggang rasa sangat penting untuk menjaga hubungan antarmanusia yang baik."
  ],
  [
    "拡大",
    "かくだい",
    "expansion, enlargement",
    "perluasan, pembesaran",
    "事業を拡大する計画がある。",
    "Jigyō o kakudai suru keikaku ga aru.",
    "Ada rencana untuk memperluas bisnis.",
    "被害の拡大を防ぐために迅速な対応が求められる。",
    "Higai no kakudai o fusegu tame ni jinsoku na taiō ga motomerareru.",
    "Diperlukan tindakan cepat untuk mencegah meluasnya kerugian."
  ],
  [
    "改善",
    "かいぜん",
    "improvement, betterment",
    "perbaikan, peningkatan",
    "作業効率を改善する。",
    "Sagyō kōritsu o kaizen suru.",
    "Meningkatkan efisiensi kerja.",
    "利用者の意見を取り入れてサービスを改善した。",
    "Riyōsha no iken o toriirete sābisu o kaizen shita.",
    "Meningkatkan kualitas layanan dengan menampung masukan pengguna."
  ],
  [
    "理解",
    "りかい",
    "understanding, comprehension",
    "pemahaman, pengertian",
    "お互いの立場を理解する。",
    "Otagai no tachiba o rikai suru.",
    "Memahami posisi satu sama lain.",
    "先生の説明を聞いて文法を深く理解した。",
    "Sensei no setsumei o kiite bunpō o fukaku rikai shita.",
    "Mendengarkan penjelasan guru dan memahami tata bahasa dengan mendalam."
  ],
  [
    "変化",
    "へんか",
    "change, variation",
    "perubahan, variasi",
    "時代の変化に適応する。",
    "Jidai no henka ni tekiō suru.",
    "Berdaptasi dengan perubahan zaman.",
    "生活習慣の変化が健康状態に良い影響を与えた。",
    "Seikatsu shūkan no henka ga kenkō jōtai ni yoi eikyō o ataeta.",
    "Perubahan pola hidup memberikan dampak positif pada kondisi kesehatan."
  ],
  [
    "意識",
    "いしき",
    "consciousness, awareness",
    "kesadaran, persepsi",
    "環境問題への意識が高まる。",
    "Kankyō mondai e no ishiki ga takamaru.",
    "Kesadaran terhadap masalah lingkungan meningkat.",
    "常にプロとしての高い意識を持って仕事に励んでいる。",
    "Tsuneni puro to shite no takai ishiki o motte shigoto ni hagende iru.",
    "Selalu tekun bekerja dengan memegang teguh kesadaran profesional yang tinggi."
  ],
  [
    "確保",
    "かくほ",
    "securing, guarantee",
    "pemasokan, pemastian, jaminan",
    "人材を確保するのが難しい。",
    "Jinzai o kakuho suru no ga muzukashii.",
    "Sulit untuk mengamankan sumber daya manusia.",
    "災害時に備えて非常用の食料と水を確保しておく。",
    "Saigai-ji ni sonaete hijōyō no shokuryō to mizu o kakuho shite oku.",
    "Mengamankan stok makanan dan air darurat untuk bersiap menghadapi bencana."
  ],
  [
    "指定",
    "してい",
    "designation, specification",
    "penunjukan, penentuan",
    "指定された場所に集合してください。",
    "Shitei sareta basho ni shūgō shite kudasai.",
    "Kumpul di tempat yang telah ditentukan.",
    "ごみの収集日は地域ごとに曜日が指定されている。",
    "Gomi no shūshūbi wa chiiki goto ni yōbi ga shitei sarete iru.",
    "Hari pengangkutan sampah ditentukan hari-harinya di setiap daerah."
  ],
  [
    "導入",
    "どうにゅう",
    "introduction, bringing in",
    "pengenalan, penerapan awal",
    "新システムを導入する。",
    "Shin-shisutemu o dōnyū suru.",
    "Menerapkan sistem baru.",
    "業務効率化のために最新のソフトウェアを導入した。",
    "Gyōmu kōritsuka no tame ni saishin no sofutowea o dōnyū shita.",
    "Menerapkan perangkat lunak terbaru demi efisiensi operasional."
  ],
  [
    "検討",
    "けんとう",
    "consideration, examination",
    "pertimbangan, pengkajian",
    "新しい企画について検討する。",
    "Atarashii kikaku ni tsuite kentō suru.",
    "Mengkaji rencana baru.",
    "いただいたご提案について前向きに検討させていただきます。",
    "Itadaita go-teian ni tsuite maemuki ni kentō sasete itadakimasu.",
    "Kami akan mengkaji proposal yang diberikan dengan terbuka dan positif."
  ],
  [
    "提供",
    "ていきょう",
    "offer, provision, supply",
    "penyediaan, penawaran",
    "新鮮な野菜を提供する。",
    "Shinsen na yasai o teikyō suru.",
    "Menyediakan sayuran segar.",
    "当ホテルでは安心で快適な宿泊空間を提供しています。",
    "Tō-hoteru de wa anshin de kaiteki na shukuhaku kūkan o teikyō shite imasu.",
    "Hotel kami menyediakan ruang menginap yang nyaman dan menenangkan."
  ],
  [
    "評価",
    "ひょうか",
    "evaluation, rating",
    "penilaian, evaluasi",
    "彼の成果は高く評価された。",
    "Kare no seika wa takaku hyōka sareta.",
    "Hasil kerjanya dinilai tinggi.",
    "努力した過程も公平に評価されるべきだ。",
    "Doryoku shita katei mo kōhei ni hyōka sareru beki da.",
    "Proses usaha juga harus dinilai secara adil."
  ],
  [
    "実施",
    "じっし",
    "enforcement, implementation",
    "pelaksanaan, penerapan",
    "来月からテストを実施する。",
    "Raigetsu kara tesuto o jisshi suru.",
    "Melaksanakan tes mulai bulan depan.",
    "予定通りに市民参加型の防災訓練を実施した。",
    "Yotei-dōri ni shimin sanka-gata no bōsai kunren o jisshi shita.",
    "Melaksanakan latihan pencegahan bencana bersama warga sesuai jadwal."
  ],
  [
    "傾向",
    "けいこう",
    "tendency, trend",
    "kecenderungan, tren",
    "若者の読書離れの傾向。",
    "Wakamono no dokusho banare no keikō.",
    "Kecenderungan pemuda menjauhi buku.",
    "景気の回復に伴い、有効求人倍率は上昇する傾向にある。",
    "Keiki no kaifuku ni tomonai, yūkō kyūjin bairitsu wa jōshō suru keikō ni aru.",
    "Seiring pemulihan ekonomi, rasio lowongan kerja cenderung meningkat."
  ],
  [
    "調整",
    "ちょうせい",
    "adjustment, coordination",
    "penyesuaian, koordinasi",
    "スケジュールを調整する。",
    "Sukejūru o chōsei suru.",
    "Menyesuaikan jadwal.",
    "各部門の意見を聞きながら計画の最終調整を進めた。",
    "Kaku-bumon no iken o kikinagara keikaku no saishū chōsei o susumeta.",
    "Melakukan penyesuaian akhir rencana sambil mendengarkan masukan dari tiap divisi."
  ]
];

// Combine coreVocab and maziiData without duplicates on word
const wordSet = new Set(coreVocab.map(v => v[0]));
const combinedVocab = [...coreVocab];

for (const m of maziiData) {
  if (!wordSet.has(m[0])) {
    wordSet.add(m[0]);
    combinedVocab.push(m);
  }
}

export const vocab = combinedVocab;
