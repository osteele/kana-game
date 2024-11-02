import React from 'react';
import { HIRAGANA_SETS } from '../data/hiragana';
import { getKanaSets } from "../data/katakana";

const Settings = ({
  level,
  setLevel,
  writingSystem,
  setWritingSystem,
  showKanaDetails,
  setShowKanaDetails
}) => {
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
              onChange={(e) => setWritingSystem(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="hiragana">Hiragana</option>
              <option value="katakana">Katakana</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        {/* Character count summary */}
        <div className="text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              Currently practicing {getKanaSets(level, writingSystem).length} characters
            </span>
            <button
              onClick={() => setShowKanaDetails(prev => !prev)}
              className="text-blue-500 hover:text-blue-600 text-sm underline"
            >
              {showKanaDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>

          {/* Expandable character details */}
          {showKanaDetails && (
            <div className="mt-4 bg-white p-4 rounded border">
              <div className="grid grid-cols-5 gap-2 md:grid-cols-8">
                {getKanaSets(level, writingSystem).map((kana, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                    <span className="text-lg">{kana.hiragana}</span>
                    <span className="text-gray-600 text-sm">({kana.romaji})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
