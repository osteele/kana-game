import { Clock, HelpCircle, Pause, Play, Settings as SettingsIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { tsParticles } from "tsparticles-engine";
import { loadConfettiPreset } from "tsparticles-preset-confetti";
import { loadFireworksPreset } from "tsparticles-preset-fireworks";
import { useGameAudio } from '../effects/GameSound';
import { PARTICLE_CONFIGS, ParticleEffectType } from '../effects/ParticleEffects';
import { LANDING_HEIGHT, ROUND_COMPLETE_THRESHOLD, useGameState } from '../hooks/useGameState';
import { KanaStatsMap } from '../stats';
import Settings from './Settings';


const KanaGame = () => {
  const { state, actions } = useGameState();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<Timer | null>(null);

  const [characterStats, setCharacterStats] = useState<KanaStatsMap>(() => {
    const saved = localStorage.getItem('kanaGameStats');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('kanaGameStats', JSON.stringify(characterStats));
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
    const config = PARTICLE_CONFIGS[type];
    const duration = type === 'roundComplete' ? 5000 : 2000;

    tsParticles.load(`${type}Particles`, config).then((container) => {
      if (container) {
        setTimeout(() => {
          container.destroy();
        }, duration);
      }
    });
  }, []);

  useEffect(() => {
    if (state.feedback && state.currentKana) {
      // Play appropriate sound and show particles
      if (state.feedback?.isCorrect) {
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
  }, [state.feedback]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isPlaying || showHelp || showSettings) return;

      switch (e.key) {
        case 'ArrowLeft':
          actions.updatePosition(
            Math.max(0, state.position.x - 5),
            state.position.y
          );
          break;
        case 'ArrowRight':
          actions.updatePosition(state.position.x + 5);
          break;
        case ' ':
          if (state.isWaitingForNext) {
            actions.initializeRound();
          } else {
            actions.updatePosition(undefined, 80);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, state.isWaitingForNext, state.position]);

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
    gameAudio.initializeAudio();
    actions.startGame();
    actions.initializeRound();
  }, [actions, gameAudio]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = useCallback(() => {
    actions.togglePause();
  }, [actions]);

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
        x: Math.random() * 10 - 5, // Random offset ±5%
        y: Math.random() * 10 - 5  // Random offset ±5%
      };

      setFallenCharacters(prev => [...prev, {
        text: state.currentKana!.text,
        x: (column * 20) + 10 + randomOffset.x, // Center of column + random offset
        y: LANDING_HEIGHT - 20, // 65, //LANDING_HEIGHT + 15 + randomOffset.y, // Near bottom + random offset
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
          speedSetting={state.speedSetting}
          setSpeedSetting={actions.setSpeedSetting}
          writingSystem={state.writingSystem}
          setWritingSystem={actions.setWritingSystem}
          showKanaDetails={showKanaDetails}
          setShowKanaDetails={setShowKanaDetails}
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
                transition-colors duration-300
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
                    p-4 text-xl rounded-lg
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
                  {choice.romaji}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {state.feedback && (
            <div
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold ${state.feedback.isCorrect ? 'text-green-500' : 'text-red-500'
                }`}
            >
              {state.feedback.message}
            </div>
          )}

        </div>
      )}

      {/* Fallen Characters */}
      {fallenCharacters.map((char, index) => (
        <div
          key={index}
          className={`absolute text-2xl transition-opacity duration-300 ${char.feedback ? 'text-green-800' : 'text-red-800'}`}
          style={{
            left: `${char.x}%`,
            top: `${char.y}%`,
            transform: `translate(-50%, -50%) rotate(${char.rotation}deg)`,
          }}
        >
          {char.text}
        </div>
      ))}
    </div>
  );
};

export default KanaGame;
