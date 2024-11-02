import { Kana } from "./kana";

const HIRAGANA_FREQUENCY = [
  "の", "い", "し", "て", "あ", "う", "お", "に", "ん", "か",
  "た", "る", "を", "が", "で", "な", "ま", "す", "く", "と",
  "も", "こ", "つ", "や", "さ", "え", "れ", "は", "ら", "き",
  "け", "そ", "ひ", "ば", "じ", "び", "ぷ", "ぴ", "ふ", "ぶ",
  "ぬ", "ね", "む", "ほ", "め", "わ", "み", "せ", "ち", "へ",
  "り", "ぐ", "ざ", "ず", "げ", "ご", "だ", "づ", "ど", "ぞ",
  "ぢ", "ぺ", "ぽ", "しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ",
  "きゃ", "きゅ", "きょ", "にゃ", "にゅ", "にょ", "ひゃ", "ひゅ", "ひょ",
  "みゃ", "みゅ", "みょ", "りゃ", "りゅ", "りょ", "ぎゃ", "ぎゅ", "ぎょ",
  "じゃ", "じゅ", "じょ", "びゃ", "びゅ", "びょ", "ぴゃ", "ぴゅ", "ぴょ",
  "よ", "ろ", "ぜ", "べ", "ぼ", "ゆ", "ぎ", "ぱ", "ぢゃ", "ぢゅ", "ぢょ"
];

// Define romaji mappings
const HIRAGANA_TO_ROMAJI: Record<string, string> = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o', 'ん': 'n',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to', 'っ': 'tsu',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'dji', 'づ': 'dzu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
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
  'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo'
};

// Define character groups by level
const HIRAGANA_LEVELS: Record<number, string[]> = {
  1: ['あ', 'い', 'う', 'え', 'お', 'ん'],
  2: ['か', 'き', 'く', 'け', 'こ'],
  3: ['さ', 'し', 'す', 'せ', 'そ'],
  4: ['た', 'ち', 'つ', 'て', 'と', 'っ'],
  5: ['な', 'に', 'ぬ', 'ね', 'の'],
  6: ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  7: ['ま', 'み', 'む', 'め', 'も'],
  8: ['や', 'ゆ', 'よ'],
  9: ['ら', 'り', 'る', 'れ', 'ろ'],
  10: ['わ', 'を', 'ん'],
  11: ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  12: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  13: ['だ', 'ぢ', 'づ', 'で', 'ど'],
  14: ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  15: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
  16: ['きょ', 'きゅ', 'きゃ', 'しょ', 'しゅ', 'しゃ'],
  17: ['ちょ', 'ちゅ', 'ちゃ', 'にょ', 'にゅ', 'にゃ'],
  18: ['ひょ', 'ひゅ', 'ひゃ', 'みょ', 'みゅ', 'みゃ'],
  19: ['りょ', 'りゅ', 'りゃ'],
  20: ['ぎょ', 'ぎゅ', 'ぎゃ', 'じょ', 'じゅ', 'じゃ'],
  21: ['びょ', 'びゅ', 'びゃ', 'ぢょ', 'ぢゅ', 'ぢゃ'],
  22: ['ぴょ', 'ぴゅ', 'ぴゃ']
};

// Dynamically construct HIRAGANA_SETS
export const HIRAGANA_SETS: Record<number, Kana[]> = Object.entries(HIRAGANA_LEVELS).reduce(
  (sets, [level, characters]) => ({
    ...sets,
    [level]: characters.map(hiragana => ({
      hiragana,
      romaji: HIRAGANA_TO_ROMAJI[hiragana]
    }))
  }),
  {}
);

// Function to find missing characters
export function findMissingHiragana(): string[] {
  // Get all unique hiragana from HIRAGANA_SETS
  const setHiragana = new Set(
    Object.values(HIRAGANA_SETS)
      .flat()
      .map(k => k.hiragana)
  );

  // Convert HIRAGANA_FREQUENCY to Set for easier comparison
  const freqSet = new Set(HIRAGANA_FREQUENCY);

  // Find characters in sets but not in frequency
  return Array.from(setHiragana).filter(h => !freqSet.has(h));
}

// Log missing characters when module is loaded
console.log('Characters in HIRAGANA_SETS but not in HIRAGANA_FREQUENCY:', findMissingHiragana());
