import React, { useState } from 'react';
import { basicKana, compoundKana, dakutenKana, handakutenKana } from '../kana/kana';

type KanaStatus = 'current' | 'previous' | 'upcoming' | null;

interface GojuuonProps {
  getCharacterStatus: (romaji: string) => KanaStatus;
  writingSystem: 'hiragana' | 'katakana' | 'both';
}

const Gojuuon: React.FC<GojuuonProps> = ({ getCharacterStatus, writingSystem }) => {
  const [activeSystem, setActiveSystem] = useState<'hiragana' | 'katakana'>('hiragana');

  const getStatusColor = (status: KanaStatus) => {
    switch (status) {
      case 'current': return 'bg-blue-100';
      case 'previous': return 'bg-green-100';
      case 'upcoming': return 'bg-gray-100';
      default: return 'bg-gray-50';
    }
  };

  const renderKanaGrid = (characters: { romaji: string, hiragana: string, katakana: string }[]) => (
    <div className="grid grid-cols-5 gap-2">
      {characters.map(({ romaji, hiragana, katakana }) => {
        const status = getCharacterStatus(romaji);
        return (
          <div
            key={romaji}
            className={`flex flex-col items-center p-2 rounded ${getStatusColor(status)}`}
          >
            <span className="text-lg">
              {activeSystem === 'hiragana' ? hiragana : katakana}
            </span>
            <span className="text-gray-600 text-xs">({romaji})</span>
          </div>
        );
      })}
    </div>
  );



  return (
    <div className="space-y-6">
      {writingSystem === 'both' && (
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${activeSystem === 'hiragana' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveSystem('hiragana')}
          >
            Hiragana
          </button>
          <button
            className={`px-4 py-2 rounded ${activeSystem === 'katakana' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveSystem('katakana')}
          >
            Katakana
          </button>
        </div>
      )}

      <div className="space-y-8">
        <section>
          <h3 className="font-bold mb-2">Basic Kana</h3>
          {renderKanaGrid(basicKana)}
        </section>

        <section>
          <h3 className="font-bold mb-2">Dakuten Kana</h3>
          {renderKanaGrid(dakutenKana)}
        </section>

        <section>
          <h3 className="font-bold mb-2">Handakuten Kana</h3>
          {renderKanaGrid(handakutenKana)}
        </section>

        <section>
          <h3 className="font-bold mb-2">Compound Kana</h3>
          {renderKanaGrid(compoundKana)}
        </section>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>Current Level</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span>Previous Levels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gojuuon;
