import { maziiData } from './mazii.js';

const coreVocab = [
  [
    "停止",
    "ていし",
    "suspension, stoppage",
    "penangguhan, penghentian sementara",
    "列車は一時停止した。",
    "Ressha wa ichiji teishi shita.",
    "Kereta berhenti sementara."
  ],
  [
    "構造",
    "こうぞう",
    "structure, framework",
    "struktur, kerangka",
    "建物の構造を調査する。",
    "Tatemono no kōzō o chōsa suru.",
    "Mengecek struktur bangunan."
  ],
  [
    "周辺",
    "しゅうへん",
    "vicinity, surroundings",
    "sekitar, lingkungan",
    "駅の周辺を散歩する。",
    "Eki no shūhen o sanpo suru.",
    "Jalan-jalan di sekitar stasiun."
  ],
  [
    "体制",
    "たいせい",
    "order, system, set-up",
    "tatanan, sistem, struktur",
    "新しい体制でスタートする。",
    "Atarashii taisei de sutāto suru.",
    "Memulai dengan sistem yang baru."
  ],
  [
    "対象",
    "たいしょう",
    "target, object, subject",
    "sasaran, objek, target",
    "高校生を対象としたアンケート。",
    "Kōkōsei o taishō to shita ankēto.",
    "Survei yang ditujukan untuk siswa SMA."
  ],
  [
    "維持",
    "いじ",
    "maintenance, preservation",
    "pemeliharaan, pemertahanan",
    "健康を維持するために運動する。",
    "Kenkō o iji suru tame ni undō suru.",
    "Berolahraga untuk menjaga kesehatan."
  ],
  [
    "拡大",
    "かくだい",
    "expansion, enlargement",
    "perluasan, pembesaran",
    "事業を拡大する計画がある。",
    "Jigyō o kakudai suru keikaku ga aru.",
    "Ada rencana untuk memperluas bisnis."
  ],
  [
    "改善",
    "かいぜん",
    "improvement, betterment",
    "perbaikan, peningkatan",
    "作業効率を改善する。",
    "Sagyō kōritsu o kaizen suru.",
    "Meningkatkan efisiensi kerja."
  ],
  [
    "理解",
    "りかい",
    "understanding, comprehension",
    "pemahaman, pengertian",
    "お互いの立場を理解する。",
    "Otagai no tachiba o rikai suru.",
    "Memahami posisi satu sama lain."
  ],
  [
    "変化",
    "へんか",
    "change, variation",
    "perubahan, variasi",
    "時代の変化に適応する。",
    "Jidai no henka ni tekiō suru.",
    "Berdaptasi dengan perubahan zaman."
  ],
  [
    "意識",
    "いしき",
    "consciousness, awareness",
    "kesadaran, persepsi",
    "環境問題への意識が高まる。",
    "Kankyō mondai e no ishiki ga takamaru.",
    "Kesadaran terhadap masalah lingkungan meningkat."
  ],
  [
    "確保",
    "かくほ",
    "securing, guarantee",
    "pemasokan, pemastian, jaminan",
    "人材を確保するのが難しい。",
    "Jinzai o kakuho suru no ga muzukashii.",
    "Sulit untuk mengamankan sumber daya manusia."
  ],
  [
    "指定",
    "してい",
    "designation, specification",
    "penunjukan, penentuan",
    "指定された場所に集合してください。",
    "Shitei sareta basho ni shūgō shite kudasai.",
    "Kumpul di tempat yang telah ditentukan."
  ],
  [
    "導入",
    "どうにゅう",
    "introduction, bringing in",
    "pengenalan, penerapan awal",
    "新システムを導入する。",
    "Shin-shisutemu o dōnyū suru.",
    "Menerapkan sistem baru."
  ],
  [
    "検討",
    "けんとう",
    "consideration, examination",
    "pertimbangan, pengkajian",
    "新しい企画について検討する。",
    "Atarashii kikaku ni tsuite kentō suru.",
    "Mengkaji rencana baru."
  ],
  [
    "提供",
    "ていきょう",
    "offer, provision, supply",
    "penyediaan, penawaran",
    "新鮮な野菜を提供する。",
    "Shinsen na yasai o teikyō suru.",
    "Menyediakan sayuran segar."
  ],
  [
    "評価",
    "ひょうか",
    "evaluation, rating",
    "penilaian, evaluasi",
    "彼の成果は高く評価された。",
    "Kare no seika wa takaku hyōka sareta.",
    "Hasil kerjanya dinilai tinggi."
  ],
  [
    "実施",
    "じっし",
    "enforcement, implementation",
    "pelaksanaan, penerapan",
    "来月からテストを実施する。",
    "Raigetsu kara tesuto o jisshi suru.",
    "Melaksanakan tes mulai bulan depan."
  ],
  [
    "傾向",
    "けいこう",
    "tendency, trend",
    "kecenderungan, tren",
    "若者の読書離れの傾向。",
    "Wakamono no dokusho banare no keikō.",
    "Kecenderungan pemuda menjauhi buku."
  ],
  [
    "調整",
    "ちょうせい",
    "adjustment, coordination",
    "penyesuaian, koordinasi",
    "スケジュールを調整する。",
    "Sukejūru o chōsei suru.",
    "Menyesuaikan jadwal."
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
