import { HIRAGANA_SETS } from "./hiragana";

// Mapping for hiragana to katakana conversion
const HIRAGANA_TO_KATAKANA = {
  'あ': 'ア', 'い': 'イ', 'う': 'ウ', 'え': 'エ', 'お': 'オ',
  'か': 'カ', 'き': 'キ', 'く': 'ク', 'け': 'ケ', 'こ': 'コ',
  'さ': 'サ', 'し': 'シ', 'す': 'ス', 'せ': 'セ', 'そ': 'ソ',
  'た': 'タ', 'ち': 'チ', 'つ': 'ツ', 'て': 'テ', 'と': 'ト',
  'な': 'ナ', 'に': 'ニ', 'ぬ': 'ヌ', 'ね': 'ネ', 'の': 'ノ',
  'は': 'ハ', 'ひ': 'ヒ', 'ふ': 'フ', 'へ': 'ヘ', 'ほ': 'ホ',
  'ま': 'マ', 'み': 'ミ', 'む': 'ム', 'め': 'メ', 'も': 'モ',
  'や': 'ヤ', 'ゆ': 'ユ', 'よ': 'ヨ',
  'ら': 'ラ', 'り': 'リ', 'る': 'ル', 'れ': 'レ', 'ろ': 'ロ',
  'わ': 'ワ', 'を': 'ヲ', 'ん': 'ン',
  'が': 'ガ', 'ぎ': 'ギ', 'ぐ': 'グ', 'げ': 'ゲ', 'ご': 'ゴ',
  'ざ': 'ザ', 'じ': 'ジ', 'ず': 'ズ', 'ぜ': 'ゼ', 'ぞ': 'ゾ',
  'だ': 'ダ', 'ぢ': 'ヂ', 'づ': 'ヅ', 'で': 'デ', 'ど': 'ド',
  'ば': 'バ', 'び': 'ビ', 'ぶ': 'ブ', 'べ': 'ベ', 'ぼ': 'ボ',
  'ぱ': 'パ', 'ぴ': 'ピ', 'ぷ': 'プ', 'ぺ': 'ペ', 'ぽ': 'ポ',
  'ゃ': 'ャ', 'ゅ': 'ュ', 'ょ': 'ョ', 'っ': 'ッ',
  'きょ': 'キョ', 'きゅ': 'キュ', 'きゃ': 'キャ',
  'しょ': 'ショ', 'しゅ': 'シュ', 'しゃ': 'シャ',
  'ちょ': 'チョ', 'ちゅ': 'チュ', 'ちゃ': 'チャ',
  'にょ': 'ニョ', 'にゅ': 'ニュ', 'にゃ': 'ニャ',
  'ひょ': 'ヒョ', 'ひゅ': 'ヒュ', 'ひゃ': 'ヒャ',
  'みょ': 'ミョ', 'みゅ': 'ミュ', 'みゃ': 'ミャ',
  'りょ': 'リョ', 'りゅ': 'リュ', 'りゃ': 'リャ',
  'ぎょ': 'ギョ', 'ぎゅ': 'ギュ', 'ぎゃ': 'ギャ',
  'じょ': 'ジョ', 'じゅ': 'ジュ', 'じゃ': 'ジャ',
  'びょ': 'ビョ', 'びゅ': 'ビュ', 'びゃ': 'ビャ',
  'ぢょ': 'ヂョ', 'ぢゅ': 'ヂュ', 'ぢゃ': 'ヂャ',
  'ぴょ': 'ピョ', 'ぴゅ': 'ピュ', 'ぴゃ': 'ピャ',
};
// Function to generate katakana sets

export const generateKatakanaSet = (hiraganaSet) => {
  return hiraganaSet.map(({ hiragana, romaji }) => ({
    hiragana: HIRAGANA_TO_KATAKANA[hiragana],
    romaji,
  }));
};
// Function to get combined sets based on writing system preference

export const getKanaSets = (level, writingSystem = 'hiragana') => {
  const hiraganaUpToLevel = Object.entries(HIRAGANA_SETS)
    .filter(([lvl]) => Number(lvl) <= level)
    .flatMap(([_, set]) => set);

  switch (writingSystem) {
    case 'hiragana':
      return hiraganaUpToLevel;
    case 'katakana':
      return hiraganaUpToLevel.map(({ hiragana, romaji }) => ({
        hiragana: HIRAGANA_TO_KATAKANA[hiragana],
        romaji,
      }));
    case 'both':
      return [
        ...hiraganaUpToLevel,
        ...hiraganaUpToLevel.map(({ hiragana, romaji }) => ({
          hiragana: HIRAGANA_TO_KATAKANA[hiragana],
          romaji,
        })),
      ];
    default:
      return hiraganaUpToLevel;
  }
};
