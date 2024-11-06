import { Clock, HelpCircle, Pause, Play, Settings as SettingsIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { tsParticles } from "tsparticles-engine";
import { loadConfettiPreset } from "tsparticles-preset-confetti";
import { loadFireworksPreset } from "tsparticles-preset-fireworks";
import { useGameAudio } from '../effects/GameSound';
import { PARTICLE_CONFIGS, ParticleEffectType } from '../effects/ParticleEffects';
import { ROUND_COMPLETE_THRESHOLD, useGameState } from '../hooks/useGameState';
import { KanaStatsMap } from '../stats';
import Settings from './Settings';

const ErrorAlert = ({ message }: { message: string }) => (
  <div role="alert" className="alert alert-error mb-4">
    <span>{message}</span>
  </div>
);

const KanaGame = () => {
  const { state, actions } = useGameState();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<Timer | null>(null);

  const [characterStats, setCharacterStats] = useState<KanaStatsMap>(() => {
    const saved = localStorage.getItem('kanaGameStats');
    return saved ? JSON.parse(saved) : {};
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('kanaGameStats', JSON.stringify(characterStats));
    } catch (err) {
      setError(`Failed to save game stats: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [characterStats]);

  // Start game timer
  useEffect(() => {
    if (state.isPlaying && !state.isPaused) {
      timerRef.current = setInterval(() => {
        actions.tickTimer();
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isPlaying, state.isPaused]);

  // Save level to localStorage
  useEffect(() => {
    localStorage.setItem('kanaGameLevel', state.level.toString());
  }, [state.level]);

  const successParticlesRef = useRef<HTMLDivElement>(null);
  const failureParticlesRef = useRef<HTMLDivElement>(null);
  const roundCompleteParticlesRef = useRef<HTMLDivElement>(null);

  // Initialize particles
  useEffect(() => {
    const initParticles = async () => {
      await loadConfettiPreset(tsParticles);
      await loadFireworksPreset(tsParticles);
    };
    initParticles();
  }, []);

  const gameAudio = useGameAudio();

  const triggerParticleEffect = useCallback((type: ParticleEffectType) => {
    try {
      const config = PARTICLE_CONFIGS[type];
      const duration = type === 'roundComplete' ? 5000 : 2000;

      tsParticles.load(`${type}Particles`, config).then((container) => {
        if (container) {
          setTimeout(() => {
            container.destroy();
          }, duration);
        }
      }).catch(err => {
        setError(`Failed to load particle effects: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
    } catch (err) {
      setError(`Particle effect error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  // Add new state for speech synthesis
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesis | null>(null);
  const [japaneseVoice, setJapaneseVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Initialize speech synthesis and find Japanese voice
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynth(window.speechSynthesis);

      // Wait for voices to load
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(voice =>
          voice.lang.startsWith('ja') || // Matches ja-JP, ja, etc.
          voice.name.toLowerCase().includes('japanese')
        );
        setJapaneseVoice(jaVoice || null);
      };

      // Initial check for voices
      handleVoicesChanged();

      // Listen for voices changed event
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, []);

  // Add state for speech setting
  const [speechEnabled, setSpeechEnabled] = useState(() => {
    const saved = localStorage.getItem('kanaGameSpeech');
    return saved ? saved === 'true' : true;  // Default to enabled
  });

  const speakKana = useCallback((text: string) => {
    try {
      if (!speechEnabled) return;
      if (speechSynth && !speechSynth.speaking) {
        const utterance = new SpeechSynthesisUtterance(text);
        if (japaneseVoice) {
          utterance.voice = japaneseVoice;
        }
        utterance.lang = 'ja-JP';
        utterance.rate = 0.8;
        console.log('speaking', text);
        speechSynth.speak(utterance);
      }
    } catch (err) {
      setError(`Speech synthesis error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [speechSynth, japaneseVoice, speechEnabled]);

  useEffect(() => {
    if (state.feedback && state.currentKana) {
      // Play appropriate sound and show particles
      if (state.feedback?.isCorrect) {
        speakKana(state.feedback.message.ja);
        gameAudio.playSuccess();
        triggerParticleEffect('success');

        if (state.score.correct > 0 && state.score.correct % ROUND_COMPLETE_THRESHOLD === 0) {
          gameAudio.playRoundComplete();
          triggerParticleEffect('roundComplete');

          actions.setPaused(true);
          tsParticles.load("roundCompleteParticles", {
            preset: "fireworks",
            particles: {
              number: { value: 10 },
              life: { duration: 3 },
            },
          }).then((container) => {
            setTimeout(() => {
              container?.destroy();
              actions.setPaused(false);
            }, 5000);
          });

          actions.handleAnswer(true, `Round Complete! Score: ${state.score.correct}`);

          setTimeout(() => {
            if (state.isPlaying) {
              actions.initializeRound();
            }
          }, 1000); // Longer delay for round completion
          return; // Exit early to prevent normal feedback
        }
      } else {
        const guess = state.feedback?.guess?.text;
        if (guess) {
          speakKana(state.feedback.message.ja);
        }
        gameAudio.playFailure();
        triggerParticleEffect('failure');
      }

      // Update character stats
      setCharacterStats(prev => {
        const key = `${state.currentKana?.text}`;
        const existing = prev[key] || { correct: 0, wrong: 0 };
        return {
          ...prev,
          [key]: {
            correct: existing.correct + (state.feedback?.isCorrect ? 1 : 0),
            wrong: existing.wrong + (state.feedback?.isCorrect ? 0 : 1),
            lastSeen: Date.now()
          }
        };
      });

      // Auto-advance after delay
      setTimeout(() => {
        if (state.isPlaying) {
          actions.initializeRound();
        }
      }, 2000);
    }
  }, [state.feedback, speakKana]); // Add speakKana to dependencies

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isPlaying || showHelp || showSettings) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (state.isPaused) return;
          actions.updatePosition(
            Math.max(0, state.position.x - 5),
            state.position.y
          );
          break;
        case 'ArrowRight':
          if (state.isPaused) return;
          actions.updatePosition(state.position.x + 5);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (state.isPaused) return;
          const columnIndex = parseInt(e.key) - 1;
          const targetX = (columnIndex * 20) + 10; // 20% per column, centered at 10%
          actions.updatePosition(targetX);
          break;
        case ' ':
          if (state.isPaused) {
            actions.setPaused(false);
            e.preventDefault(); // Prevent space from triggering twice
            return;
          }
          if (!state.isPaused) {
            if (state.isWaitingForNext) {
              actions.initializeRound();
            } else {
              actions.updatePosition(undefined, 80);
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, state.isWaitingForNext, state.position, state.isPaused]);

  // Handle column click/tap
  const handleColumnClick = (index: number) => {
    if (!state.isPlaying || state.isWaitingForNext || state.isPaused) return;
    const targetX = (index * 20) + 10; // 20% per column, centered at 10%

    // Get current column based on x position
    const currentColumn = Math.floor((state.position.x / 100) * 5);

    if (currentColumn === index) {
      // If clicking current column, drop to bottom
      actions.updatePosition(targetX, 80);
    } else {
      // If clicking different column, just move horizontally
      actions.updatePosition(targetX);
    }
  };

  const startGame = useCallback(() => {
    try {
      gameAudio.initializeAudio();
      actions.startGame();
      actions.initializeRound();
      setError(null);
    } catch (err) {
      setError(`Failed to start game: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [actions, gameAudio]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = useCallback(() => {
    if (state.isPaused) {
      actions.popPause();
    } else {
      actions.pushPause();
    }
  }, [actions, state.isPaused]);

  // Show kana details state
  const [showKanaDetails, setShowKanaDetails] = useState(false);

  const toggleSettings = useCallback(() => {
    if (!showSettings) {
      actions.pushPause();
    } else {
      actions.popPause();
    }
    setShowSettings(!showSettings);
  }, [actions]);

  const toggleHelp = useCallback(() => {
    if (!showHelp) {
      actions.pushPause();
    } else {
      actions.popPause();
    }
    setShowHelp(!showHelp);
  }, [actions]);

  // Add global keyboard handlers for help
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      switch (e.key) {
        case '?':
          if (!showSettings) {
            toggleHelp();
          }
          break;
        case 'Escape':
          if (showHelp) {
            toggleHelp();
          } else if (showSettings) {
            toggleSettings();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (state.isPlaying && document.hidden) {
        actions.pushPause();
      }
    };

    const handleFocus = () => {
      if (state.isPlaying && document.hidden === false) {
        actions.popPause();
      }
    };

    const handleBlur = () => {
      if (state.isPlaying) {
        actions.pushPause();
      }
    };

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [state.isPlaying, actions]);

  const [fallenCharacters, setFallenCharacters] = useState<Array<{ text: string, x: number, y: number, rotation: number, feedback: boolean }>>([]);

  useEffect(() => {
    if (state.feedback && state.currentKana) {
      const column = Math.floor((state.position.x / 100) * 5);
      const randomOffset = {
        x: Math.random() * 10 - 5,
        y: Math.random() * 10,
      };

      setFallenCharacters(prev => [...prev, {
        text: state.currentKana!.text,
        x: (column * 20) + 10 + randomOffset.x, // Center of column + random offset
        y: randomOffset.y,
        rotation: Math.random() * 60 - 30,
        feedback: state.feedback?.isCorrect ?? false,
      }]);
    }
  }, [state.feedback]);

  useEffect(() => {
    setFallenCharacters([]);
  }, [state.level]);

  return (
    <div className="w-full h-full max-w-2xl mx-auto p-2 sm:p-4 select-none">
      {/* Add particle containers */}
      <div id="successParticles" ref={successParticlesRef} className="fixed inset-0 pointer-events-none z-50" />
      <div id="failureParticles" ref={failureParticlesRef} className="fixed inset-0 pointer-events-none z-50" />
      <div id="roundCompleteParticles" ref={roundCompleteParticlesRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <Clock className="w-5 h-5" />
          <span className="text-lg">{formatTime(state.elapsedTime)}</span>
          <div className="text-lg">
            ✓ {state.score.correct} | ✗ {state.score.wrong}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {state.isPlaying && (
            <button
              onClick={togglePause}
              className="p-2 rounded hover:bg-gray-100"
              tabIndex={-1}
            >
              {state.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={toggleHelp}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSettings}
            className="p-2 rounded hover:bg-gray-100"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <div className="space-y-3">
              <p>Match the falling kana character with its correct romaji pronunciation.</p>

              <div className="font-bold mt-2">Controls:</div>
              <ul className="list-disc pl-5">
                <li>Use <span className="font-mono">←</span> and <span className="font-mono">→</span> arrow keys to move left and right</li>
                <li>Use number keys <span className="font-mono">1-5</span> to move to specific columns</li>
                <li>Click or tap on a column to move there</li>
                <li>Click or tap on the current column to drop instantly</li>
                <li>Press <span className="font-mono">Space</span> to drop the character or start the next round</li>
                <li>Press <span className="font-mono">?</span> to show this help</li>
                <li>Press <span className="font-mono">Esc</span> to close this help</li>
              </ul>

              <div className="font-bold mt-2">Tips:</div>
              <ul className="list-disc pl-5">
                <li>The game pauses automatically when opening settings</li>
                <li>Use the pause button (⏸️) to take a break</li>
                <li>Practice with easier levels first to learn the characters</li>
              </ul>
            </div>
            <button
              onClick={toggleHelp}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <Settings
          level={state.level}
          setLevel={actions.setLevel}
          writingSystem={state.writingSystem}
          setWritingSystem={actions.setWritingSystem}
          showKanaDetails={showKanaDetails}
          setShowKanaDetails={setShowKanaDetails}
          speedSetting={state.speedSetting}
          setSpeedSetting={actions.setSpeedSetting}
          speechEnabled={speechEnabled}
          setSpeechEnabled={setSpeechEnabled}
          onClose={toggleSettings}
        />
      )}

      {/* Game Area */}
      {!state.isPlaying ? (
        <div className="text-center mt-20">
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="relative w-full h-[500px] border-2 border-gray-200 rounded overflow-hidden">
          {/* Falling Kana */}
          {state.currentKana && (
            <div
              className={`
                absolute text-4xl transform -translate-x-1/2 z-20
                ${state.isWaitingForNext && state.feedback?.isCorrect
                  ? 'text-green-600'
                  : state.isWaitingForNext
                    ? 'text-red-600'
                    : 'text-gray-800'
                }
                font-bold drop-shadow-md
                transition-[left] duration-300 ease-in-out
              `}
              style={{
                left: `${state.position.x}%`,
                top: `calc(${state.position.y}% - 3rem)`,
                transform: 'translateX(-50%)',
              }}
            >
              {state.currentKana.text}
            </div>
          )}

          {/* Answer Columns */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="grid grid-cols-5 gap-4 relative p-4">
              <div className="absolute inset-0 bg-gray-50 rounded-xl -z-10" />
              {state.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleColumnClick(index)}
                  className={`
                    relative p-4 text-xl rounded-lg
                    transition-all duration-300
                    hover:scale-105 hover:shadow-lg
                    active:scale-95
                    ${state.isWaitingForNext ? 'pointer-events-none' : ''}
                    ${state.isWaitingForNext && state.currentKana?.romaji === choice.romaji
                      ? 'bg-green-100 animate-correct-answer ring-2 ring-green-500'
                      : state.isWaitingForNext && index === Math.floor((state.position.x / 100) * 5)
                        ? 'bg-red-100 animate-wrong-answer ring-2 ring-red-500'
                        : index === Math.floor((state.position.x / 100) * 5)
                          ? 'bg-blue-100'
                          : 'bg-white hover:bg-blue-50'
                    }
                  `}
                >
                  <span className="hidden sm:block absolute bottom-1 left-2 text-xs font-mono text-gray-400">
                    {index + 1}
                  </span>
                  {choice.romaji}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {state.feedback && (
            <div
              className={`
                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                text-xl font-bold serif
                ${state.feedback.isCorrect ? 'text-green-500' : 'text-red-500'}
              `}
            >
              {state.feedback.message.en}
            </div>
          )}

        </div>
      )
      }

      {/* Fallen Characters */}
      <div className="h-10 w-full relative">
        {fallenCharacters.map((char, index) => (
          <div
            key={index}
            className={`
              w-5 h-5 absolute
              ${char.feedback ? 'text-green-800' : 'text-red-800'}
              text-2xl font-['Yusei_Magic']
            `}
            style={{
              left: `${char.x}%`,
              top: `${char.y}%`,
              transform: `translate(-50%, -50%) rotate(${char.rotation}deg) translate(50%, 50%)`,
            }}
          >
            {char.text}
          </div>
        ))}
      </div>
    </div >
  );
};

export default KanaGame;
