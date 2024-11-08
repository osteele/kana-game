import { HIRAGANA_SETS } from "./hiragana";
import { HIRAGANA_TO_KATAKANA } from "./katakana";

export type CharacterSet = "hiragana" | "katakana" | "both";

export type Kana = {
  kana: string;
  romaji: string;
};

export type Hiragana = {
  hiragana: string;
  romaji: string;
};

export const basicKana = [
  // あ行 (a row)
  { romaji: "a", hiragana: "あ", katakana: "ア" },
  { romaji: "i", hiragana: "い", katakana: "イ" },
  { romaji: "u", hiragana: "う", katakana: "ウ" },
  { romaji: "e", hiragana: "え", katakana: "エ" },
  { romaji: "o", hiragana: "お", katakana: "オ" },
  // か行 (k row)
  { romaji: "ka", hiragana: "か", katakana: "カ" },
  { romaji: "ki", hiragana: "き", katakana: "キ" },
  { romaji: "ku", hiragana: "く", katakana: "ク" },
  { romaji: "ke", hiragana: "け", katakana: "ケ" },
  { romaji: "ko", hiragana: "こ", katakana: "コ" },
  // さ行 (s row)
  { romaji: "sa", hiragana: "さ", katakana: "サ" },
  { romaji: "shi", hiragana: "し", katakana: "シ" },
  { romaji: "su", hiragana: "す", katakana: "ス" },
  { romaji: "se", hiragana: "せ", katakana: "セ" },
  { romaji: "so", hiragana: "そ", katakana: "ソ" },
  // た行 (t row)
  { romaji: "ta", hiragana: "た", katakana: "タ" },
  { romaji: "chi", hiragana: "ち", katakana: "チ" },
  { romaji: "tsu", hiragana: "つ", katakana: "ツ" },
  { romaji: "te", hiragana: "て", katakana: "テ" },
  { romaji: "to", hiragana: "と", katakana: "ト" },
  // な行 (n row)
  { romaji: "na", hiragana: "な", katakana: "ナ" },
  { romaji: "ni", hiragana: "に", katakana: "ニ" },
  { romaji: "nu", hiragana: "ぬ", katakana: "ヌ" },
  { romaji: "ne", hiragana: "ね", katakana: "ネ" },
  { romaji: "no", hiragana: "の", katakana: "ノ" },
  // は行 (h row)
  { romaji: "ha", hiragana: "は", katakana: "ハ" },
  { romaji: "hi", hiragana: "ひ", katakana: "ヒ" },
  { romaji: "fu", hiragana: "ふ", katakana: "フ" },
  { romaji: "he", hiragana: "へ", katakana: "ヘ" },
  { romaji: "ho", hiragana: "ほ", katakana: "ホ" },
  // ま行 (m row)
  { romaji: "ma", hiragana: "ま", katakana: "マ" },
  { romaji: "mi", hiragana: "み", katakana: "ミ" },
  { romaji: "mu", hiragana: "む", katakana: "ム" },
  { romaji: "me", hiragana: "め", katakana: "メ" },
  { romaji: "mo", hiragana: "も", katakana: "モ" },
  // や行 (y row)
  { romaji: "ya", hiragana: "や", katakana: "ヤ" },
  { romaji: "yu", hiragana: "ゆ", katakana: "ユ" },
  { romaji: "yo", hiragana: "よ", katakana: "ヨ" },
  // ら行 (r row)
  { romaji: "ra", hiragana: "ら", katakana: "ラ" },
  { romaji: "ri", hiragana: "り", katakana: "リ" },
  { romaji: "ru", hiragana: "る", katakana: "ル" },
  { romaji: "re", hiragana: "れ", katakana: "レ" },
  { romaji: "ro", hiragana: "ろ", katakana: "ロ" },
  // わ行 (w row)
  { romaji: "wa", hiragana: "わ", katakana: "ワ" },
  { romaji: "wo", hiragana: "を", katakana: "ヲ" },
  // ん (n)
  { romaji: "n", hiragana: "ん", katakana: "ン" },
];

export const dakutenKana = [
  // が行 (g row)
  { romaji: "ga", hiragana: "が", katakana: "ガ" },
  { romaji: "gi", hiragana: "ぎ", katakana: "ギ" },
  { romaji: "gu", hiragana: "ぐ", katakana: "グ" },
  { romaji: "ge", hiragana: "げ", katakana: "ゲ" },
  { romaji: "go", hiragana: "ご", katakana: "ゴ" },
  // ざ行 (z row)
  { romaji: "za", hiragana: "ざ", katakana: "ザ" },
  { romaji: "ji", hiragana: "じ", katakana: "ジ" },
  { romaji: "zu", hiragana: "ず", katakana: "ズ" },
  { romaji: "ze", hiragana: "ぜ", katakana: "ゼ" },
  { romaji: "zo", hiragana: "ぞ", katakana: "ゾ" },
  // だ行 (d row)
  { romaji: "da", hiragana: "だ", katakana: "ダ" },
  { romaji: "dji", hiragana: "ぢ", katakana: "ヂ" },
  { romaji: "dzu", hiragana: "づ", katakana: "ヅ" },
  { romaji: "de", hiragana: "で", katakana: "デ" },
  { romaji: "do", hiragana: "ど", katakana: "ド" },
  // ば行 (b row)
  { romaji: "ba", hiragana: "ば", katakana: "バ" },
  { romaji: "bi", hiragana: "び", katakana: "ビ" },
  { romaji: "bu", hiragana: "ぶ", katakana: "ブ" },
  { romaji: "be", hiragana: "べ", katakana: "ベ" },
  { romaji: "bo", hiragana: "ぼ", katakana: "ボ" },
];

export const handakutenKana = [
  // ぱ行 (p row)
  { romaji: "pa", hiragana: "ぱ", katakana: "パ" },
  { romaji: "pi", hiragana: "ぴ", katakana: "ピ" },
  { romaji: "pu", hiragana: "ぷ", katakana: "プ" },
  { romaji: "pe", hiragana: "ぺ", katakana: "ペ" },
  { romaji: "po", hiragana: "ぽ", katakana: "ポ" },
];

export const compoundKana = [
  // きゃ行 (ky row)
  { romaji: "kya", hiragana: "きゃ", katakana: "キャ" },
  { romaji: "kyu", hiragana: "きゅ", katakana: "キュ" },
  { romaji: "kyo", hiragana: "きょ", katakana: "キョ" },
  // ぎゃ行 (gy row)
  { romaji: "gya", hiragana: "ぎゃ", katakana: "ギャ" },
  { romaji: "gyu", hiragana: "ぎゅ", katakana: "ギュ" },
  { romaji: "gyo", hiragana: "ぎょ", katakana: "ギョ" },
  // しゃ行 (sh row)
  { romaji: "sha", hiragana: "しゃ", katakana: "シャ" },
  { romaji: "shu", hiragana: "しゅ", katakana: "シュ" },
  { romaji: "sho", hiragana: "しょ", katakana: "ショ" },
  // じゃ行 (j row)
  { romaji: "ja", hiragana: "じゃ", katakana: "ジャ" },
  { romaji: "ju", hiragana: "じゅ", katakana: "ジュ" },
  { romaji: "jo", hiragana: "じょ", katakana: "ジョ" },
  // ちゃ行 (ch row)
  { romaji: "cha", hiragana: "ちゃ", katakana: "チャ" },
  { romaji: "chu", hiragana: "ちゅ", katakana: "チュ" },
  { romaji: "cho", hiragana: "ちょ", katakana: "チョ" },
  // にゃ行 (ny row)
  { romaji: "nya", hiragana: "にゃ", katakana: "ニャ" },
  { romaji: "nyu", hiragana: "にゅ", katakana: "ニュ" },
  { romaji: "nyo", hiragana: "にょ", katakana: "ニョ" },
  // ひゃ行 (hy row)
  { romaji: "hya", hiragana: "ひゃ", katakana: "ヒャ" },
  { romaji: "hyu", hiragana: "ひゅ", katakana: "ヒュ" },
  { romaji: "hyo", hiragana: "ひょ", katakana: "ヒョ" },
  // びゃ行 (by row)
  { romaji: "bya", hiragana: "びゃ", katakana: "ビャ" },
  { romaji: "byu", hiragana: "びゅ", katakana: "ビュ" },
  { romaji: "byo", hiragana: "びょ", katakana: "ビョ" },
  // ぴゃ行 (py row)
  { romaji: "pya", hiragana: "ぴゃ", katakana: "ピャ" },
  { romaji: "pyu", hiragana: "ぴゅ", katakana: "ピュ" },
  { romaji: "pyo", hiragana: "ぴょ", katakana: "ピョ" },
  // みゃ行 (my row)
  { romaji: "mya", hiragana: "みゃ", katakana: "ミャ" },
  { romaji: "myu", hiragana: "みゅ", katakana: "ミュ" },
  { romaji: "myo", hiragana: "みょ", katakana: "ミョ" },
  // りゃ行 (ry row)
  { romaji: "rya", hiragana: "りゃ", katakana: "リャ" },
  { romaji: "ryu", hiragana: "りゅ", katakana: "リュ" },
  { romaji: "ryo", hiragana: "りょ", katakana: "リョ" },
];

// Sets of visually similar characters
export const similarHiragana = [
  ["あ", "お"],
  ["い", "り"],
  ["き", "さ"],
  ["け", "は"],
  ["さ", "ち"],
  ["す", "ぬ"],
  ["つ", "し"],
  ["つ", "う"],
  ["な", "た"],
  ["に", "こ"],
  ["ぬ", "め"],
  ["ね", "れ"],
  ["の", "ぬ"],
  ["は", "ほ"],
  ["め", "ぬ"],
  ["る", "ろ"],
  ["わ", "れ"],
];

export const similarKatakana = [
  ["ウ", "フ"],
  ["シ", "ツ", "ソ", "ン"],
  ["ノ", "ソ", "ン"],
  ["ス", "ヌ"],
  ["チ", "セ"],
  ["チ", "テ"],
  ["テ", "ナ"],
  ["ノ", "フ"],
  ["ノ", "メ"],
  ["メ", "ヌ"],
  ["ワ", "ク"],
];

export const similarKana = [
  ...similarHiragana,
  ...similarKatakana,
  ["く", "ク"],
  ["せ", "サ"],
  ["さ", "サ"],
  ["き", "キ"],
  ["り", "リ"],
  ["ち", "チ"],
  ["に", "ニ"],
  ["の", "ノ"],
];

export const identicalKana = [["へ", "ヘ"]];

// Helper function to determine if a character is hiragana
export const isHiragana = (char: string): boolean => {
  // Check if it's a compound
  if (char.length > 1) {
    return isHiragana(char[0]); // Check first character
  }
  return char >= "ぁ" && char <= "ゖ";
};

// Helper function to determine if a character is katakana
export const isKatakana = (char: string): boolean => {
  // Check if it's a compound
  if (char.length > 1) {
    return isKatakana(char[0]); // Check first character
  }
  return char >= "ァ" && char <= "ヶ";
};

// Function to get visually similar characters
export const getSimilarCharacters = (
  char: string,
  allowOppositeSet: boolean = false
): string[] => {
  // Handle compound characters
  if (char.length > 1) {
    const baseChar = char[0];
    const suffix = char.slice(1);
    const similarBase = getSimilarCharacters(baseChar, allowOppositeSet);
    return similarBase.map((c) => c + suffix);
  }

  let similarSets: string[][] = [];

  if (allowOppositeSet) {
    similarSets = similarKana.filter((set) => set.includes(char));
  } else if (isHiragana(char)) {
    similarSets = similarHiragana.filter((set) => set.includes(char));
  } else if (isKatakana(char)) {
    similarSets = similarKatakana.filter((set) => set.includes(char));
  }

  // Merge all sets and remove duplicates and the original character
  return [...new Set(similarSets.flat())].filter((c) => c !== char);
};

// Get combined sets based on writing system preference
export const getKanaSets = (
  level: number,
  writingSystem: CharacterSet = "hiragana"
): Kana[] => {
  const hiraganaUpToLevel = Object.entries(HIRAGANA_SETS)
    .filter(([lvl]) => Number(lvl) <= level)
    .flatMap(([_, set]) => set);

  switch (writingSystem) {
    case "hiragana":
      return hiraganaUpToLevel;
    case "katakana":
      return hiraganaUpToLevel.map(({ kana: hiragana, romaji }) => ({
        kana: HIRAGANA_TO_KATAKANA[hiragana],
        romaji,
      }));
    case "both":
      return [
        ...hiraganaUpToLevel,
        ...hiraganaUpToLevel.map(({ kana: hiragana, romaji }) => ({
          kana: HIRAGANA_TO_KATAKANA[hiragana],
          romaji,
        })),
      ];
    default:
      return hiraganaUpToLevel;
  }
};
