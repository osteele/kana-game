import { HIRAGANA_SETS } from '../kana/hiragana';
import { CharacterSet, getKanaSets } from '../kana/kana';
import { VoiceOption } from '../effects/SpeechSynthesis';
import Gojuuon from './Gojuuon';
import { useState } from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';

const Settings = ({
  level,
  setLevel,
  writingSystem,
  setWritingSystem,
  showKanaDetails,
  setShowKanaDetails,
  speedSetting,
  setSpeedSetting,
  speechEnabled,
  setSpeechEnabled,
  apiKey,
  setApiKey,
  availableVoices,
  selectedVoice,
  setSelectedVoice,
  speakSample,
  onClose
}: {
  level: number;
  setLevel: (level: number) => void;
  writingSystem: CharacterSet;
  setWritingSystem: (writingSystem: CharacterSet) => void;
  showKanaDetails: boolean;
  setShowKanaDetails: (showKanaDetails: boolean) => void;
  speedSetting: 'slow' | 'normal' | 'fast';
  setSpeedSetting: (speed: 'slow' | 'normal' | 'fast') => void;
  speechEnabled: boolean;
  setSpeechEnabled: (enabled: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  availableVoices: VoiceOption[];
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  speakSample: (voiceId: string) => void;
  onClose: () => void;
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  
  const getCharacterStatus = (romaji: string) => {
    const currentKana = getKanaSets(level, writingSystem).find(k => k.romaji === romaji);
    const previousKana = getKanaSets(level - 1, writingSystem).find(k => k.romaji === romaji);

    if (currentKana) return 'current';
    if (previousKana) return 'previous';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Level and writing system controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4">
                <label className="min-w-24">Level:</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="p-2 border rounded flex-grow"
                >
                  {Object.keys(HIRAGANA_SETS).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Level {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="min-w-24">Writing System:</label>
                <select
                  value={writingSystem}
                  onChange={(e) => setWritingSystem(e.target.value.toLowerCase() as CharacterSet)}
                  className="p-2 border rounded flex-grow"
                >
                  <option value="hiragana">Hiragana</option>
                  <option value="katakana">Katakana</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="min-w-24">Game Speed:</label>
                <select
                  value={speedSetting}
                  onChange={(e) => setSpeedSetting(e.target.value as 'slow' | 'normal' | 'fast')}
                  className="p-2 border rounded flex-grow"
                >
                  <option value="slow">Slow (Beginner)</option>
                  <option value="normal">Normal (Intermediate)</option>
                  <option value="fast">Fast (Advanced)</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="min-w-24">Speech:</label>
                <select
                  value={speechEnabled ? 'enabled' : 'disabled'}
                  onChange={(e) => {
                    const enabled = e.target.value === 'enabled';
                    setSpeechEnabled(enabled);
                  }}
                  className="p-2 border rounded flex-grow"
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Voice Options */}
          {speechEnabled && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Voice Settings</h3>
              
              {/* Voice selector */}
              <div className="flex items-center space-x-4 mb-3">
                <label className="min-w-24">Voice:</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => {
                    const newVoice = e.target.value;
                    setSelectedVoice(newVoice);
                    if (newVoice) {
                      speakSample(newVoice);
                    }
                  }}
                  className="p-2 border rounded flex-grow"
                  disabled={availableVoices.length === 0}
                >
                  {availableVoices.length === 0 ? (
                    <option value="">No voices available</option>
                  ) : (
                    <>
                      {apiKey && (
                        <>
                          <optgroup label="ElevenLabs Voices that support Japanese">
                            {(() => {
                              const japaneseVoices = availableVoices
                                .filter(voice => voice.supportsJapanese && voice.provider === "elevenlabs");
                              
                              if (japaneseVoices.length === 0) {
                                return (
                                  <option disabled value="">
                                    No Japanese ElevenLabs voices available
                                  </option>
                                );
                              }
                              
                              return japaneseVoices.map((voice) => (
                                <option key={voice.id} value={voice.id}>
                                  {voice.name || "Unnamed Voice"}
                                </option>
                              ));
                            })()}
                          </optgroup>
                          
                          <optgroup label="Other ElevenLabs Voices">
                            {(() => {
                              const otherVoices = availableVoices
                                .filter(voice => !voice.supportsJapanese && voice.provider === "elevenlabs");
                              
                              if (otherVoices.length === 0) {
                                return (
                                  <option disabled value="">
                                    No other ElevenLabs voices available
                                  </option>
                                );
                              }
                              
                              return otherVoices.map((voice) => (
                                <option key={voice.id} value={voice.id}>
                                  {voice.name || "Unnamed Voice"}
                                </option>
                              ));
                            })()}
                          </optgroup>
                        </>
                      )}
                      
                      <optgroup label="Browser Voices that support Japanese">
                        {(() => {
                          const japaneseVoices = availableVoices
                            .filter(voice => voice.supportsJapanese && voice.provider === "browser");
                          
                          if (japaneseVoices.length === 0) {
                            return (
                              <option disabled value="">
                                No Japanese browser voices available
                              </option>
                            );
                          }
                          
                          return japaneseVoices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                              {voice.name || "Unnamed Voice"}
                            </option>
                          ));
                        })()}
                      </optgroup>
                      
                      <optgroup label="Other Browser Voices">
                        {(() => {
                          const otherVoices = availableVoices
                            .filter(voice => !voice.supportsJapanese && voice.provider === "browser");
                          
                          if (otherVoices.length === 0) {
                            return (
                              <option disabled value="">
                                No other browser voices available
                              </option>
                            );
                          }
                          
                          return otherVoices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                              {voice.name || "Unnamed Voice"}
                            </option>
                          ));
                        })()}
                      </optgroup>
                    </>
                  )}
                </select>
              </div>
              
              {/* ElevenLabs API Key */}
              <div className="mt-4">
                <div className="flex items-start mb-2">
                  <label className="min-w-24 mt-2">ElevenLabs API Key:</label>
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your ElevenLabs API key"
                        className="p-2 border rounded flex-grow"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                        aria-label={showApiKey ? "Hide API key" : "Show API key"}
                      >
                        {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <a
                        href="https://elevenlabs.io/speech-synthesis"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:text-blue-700"
                      >
                        Get an ElevenLabs API key <ExternalLink size={14} className="ml-1" />
                      </a>
                      <p className="mt-1">
                        Adding an API key enables high-quality Japanese voice synthesis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Character count summary */}
          <div className="border-t pt-4">
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
              <div className="mt-4 bg-gray-50 p-4 rounded border">
                <Gojuuon
                  getCharacterStatus={getCharacterStatus}
                  writingSystem={writingSystem}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;