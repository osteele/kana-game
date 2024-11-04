import { HIRAGANA_SETS } from '../kana/hiragana';
import { CharacterSet, getKanaSets } from '../kana/kana';
import Gojuuon from './Gojuuon';

const Settings = ({
  level,
  setLevel,
  writingSystem,
  setWritingSystem,
  showKanaDetails,
  setShowKanaDetails,
  speedSetting,
  setSpeedSetting
} : {
  level: number;
  setLevel: (level: number) => void;
  writingSystem: CharacterSet;
  setWritingSystem: (writingSystem: CharacterSet) => void;
  showKanaDetails: boolean;
  setShowKanaDetails: (showKanaDetails: boolean) => void;
  speedSetting: 'slow' | 'normal' | 'fast';
  setSpeedSetting: (speed: 'slow' | 'normal' | 'fast') => void;
}) => {
  const getCharacterStatus = (romaji: string) => {
    const currentKana = getKanaSets(level, writingSystem).find(k => k.romaji === romaji);
    const previousKana = getKanaSets(level - 1, writingSystem).find(k => k.romaji === romaji);

    if (currentKana) return 'current';
    if (previousKana) return 'previous';
    return 'upcoming';
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded">
      <div className="space-y-4">
        {/* Level and writing system controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <label>Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="p-2 border rounded"
            >
              {Object.keys(HIRAGANA_SETS).map((lvl) => (
                <option key={lvl} value={lvl}>
                  Level {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label>Writing System:</label>
            <select
              value={writingSystem}
              onChange={(e) => setWritingSystem(e.target.value.toLowerCase() as CharacterSet)}
              className="p-2 border rounded"
            >
              <option value="hiragana">Hiragana</option>
              <option value="katakana">Katakana</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label>Game Speed:</label>
            <select
              value={speedSetting}
              onChange={(e) => setSpeedSetting(e.target.value as 'slow' | 'normal' | 'fast')}
              className="p-2 border rounded"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
            <span className="text-sm text-gray-500">
              {speedSetting === 'slow' && '(Beginner)'}
              {speedSetting === 'normal' && '(Intermediate)'}
              {speedSetting === 'fast' && '(Advanced)'}
            </span>
          </div>
        </div>

        {/* Character count summary */}
        <div className="text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              Currently practicing {getKanaSets(level, writingSystem).length} characters
            </span>
            <button
              onClick={() => setShowKanaDetails(!showKanaDetails)}
              className="text-blue-500 hover:text-blue-600 text-sm underline"
            >
              {showKanaDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>

          {/* Expandable character details */}
          {showKanaDetails && (
            <div className="mt-4 bg-white p-4 rounded border">
              <Gojuuon
                getCharacterStatus={getCharacterStatus}
                writingSystem={writingSystem}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
