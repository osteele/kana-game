import { Clock, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ISourceOptions } from "tsparticles-engine";
import { tsParticles } from "tsparticles-engine";
import { loadConfettiPreset } from "tsparticles-preset-confetti";
import { loadFireworksPreset } from "tsparticles-preset-fireworks";
import { ACCELERATION_RATES, LANDING_HEIGHT, useGameState } from '../hooks/useGameState';
import { KanaStatsMap } from '../stats';
import Settings from './Settings';

const ROUND_COMPLETE_THRESHOLD = 10;



type ParticleEffectType = 'success' | 'failure' | 'roundComplete';

const PARTICLE_CONFIGS: Record<ParticleEffectType, ISourceOptions> = {
  success: {
    preset: "confetti",
    fullScreen: { enable: true },
    particles: {
      number: { value: 50 },
      life: { duration: { value: 2 } }
    }
  } as ISourceOptions,
  failure: {
    preset: "confetti",
    fullScreen: { enable: true },
    particles: {
      color: { value: "#ff0000" },
      number: { value: 30 },
      life: { duration: { value: 1.5 } }
    }
  } as ISourceOptions,
  roundComplete: {
    preset: "fireworks",
    fullScreen: { enable: true },
    particles: {
      number: { value: 10 },
      life: { duration: { value: 3 } }
    }
  } as ISourceOptions
};

interface GameSound {
  playSuccess: () => void;
  playFailure: () => void;
  playRoundComplete: () => void;
}

const useGameAudio = (): GameSound => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Create sound functions
  const playSuccess = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Happy sound: C major arpeggio
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  const playFailure = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sad sound: Descending tone
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  }, []);

  const playRoundComplete = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Celebratory ascending pattern
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);     // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    oscillator.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  }, []);

  return {
    playSuccess,
    playFailure,
    playRoundComplete
  };
};

const KanaGame = () => {
  const { state, actions } = useGameState();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [_previousPauseState, setPreviousPauseState] = useState(false);
  const timerRef = useRef<Timer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [characterStats, setCharacterStats] = useState<KanaStatsMap>(() => {
    const saved = localStorage.getItem('kanaGameStats');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('kanaGameStats', JSON.stringify(characterStats));
  }, [characterStats]);

  // Replace initializeGame with:
  const initializeGame = useCallback(() => {
    actions.initializeRound();
  }, [actions]);

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

  // Handle animation frame updates for falling kana
  const animate = useCallback(() => {
    if (state.isPlaying && !state.isWaitingForNext && !state.isPaused) {
      // Use acceleration rate based on speed setting
      const accelerationRate = ACCELERATION_RATES[state.speedSetting];
      const newVelocity = state.velocity + accelerationRate;
      actions.setVelocity(newVelocity);

      // Calculate new position
      const newY = state.position.y + newVelocity;
      actions.updatePosition(state.position.x, newY);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [state.isPlaying, state.isWaitingForNext, state.isPaused, state.position, state.velocity, state.speedSetting]);

  // Start animation loop
  useEffect(() => {
    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, animate]);

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

  const { playSuccess, playFailure, playRoundComplete } = useGameAudio();

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
    if (state.position.y >= LANDING_HEIGHT && !state.isWaitingForNext && state.currentKana) {
      const column = Math.floor((state.position.x / 100) * 5);
      const isCorrect = state.choices[column].romaji === state.currentKana.romaji;
      actions.handleAnswer(isCorrect, '');

      // Play appropriate sound
      if (isCorrect) {
        playSuccess();
        triggerParticleEffect('success');

        if (state.score.correct > 0 && state.score.correct % ROUND_COMPLETE_THRESHOLD === 0) {
          playRoundComplete();
          triggerParticleEffect('roundComplete');

          tsParticles.load("roundCompleteParticles", {
            preset: "fireworks",
            particles: {
              number: { value: 10 },
              life: { duration: 3 },
            },
          }).then((container) => {
            setTimeout(() => {
              container?.destroy();
            }, 5000);
          });

          actions.handleAnswer(true, `Round Complete! Score: ${state.score.correct}`);

          setTimeout(() => {
            if (state.isPlaying) {
              initializeGame();
            }
          }, 1000); // Longer delay for round completion
          return; // Exit early to prevent normal feedback
        }
      } else {
        playFailure();
        triggerParticleEffect('failure');
      }

      // Update character stats
      setCharacterStats(prev => {
        const key = `${state.currentKana?.text}`;
        const existing = prev[key] || { correct: 0, wrong: 0 };
        return {
          ...prev,
          [key]: {
            correct: existing.correct + (isCorrect ? 1 : 0),
            wrong: existing.wrong + (isCorrect ? 0 : 1),
            lastSeen: Date.now()
          }
        };
      });

      actions.handleAnswer(isCorrect, isCorrect ? 'Correct!' : `Incorrect. The answer was "${state.currentKana.romaji}"`);

      actions.setWaitingForNext(true);

      // Auto-advance after delay
      setTimeout(() => {
        if (state.isPlaying) {
          initializeGame();
        }
      }, 2000);
    }
  }, [state.position.y, state.choices, state.currentKana, state.isPlaying, initializeGame, state.score]);

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
            initializeGame();
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

  const startGame = () => {
    actions.startGame();
    initializeGame();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    actions.togglePause();
  };

  // Show kana details state
  const [showKanaDetails, setShowKanaDetails] = useState(false);

  // Modify settings toggle to handle pausing
  const toggleSettings = () => {
    if (!showSettings) {
      // About to show settings
      setPreviousPauseState(state.isPaused);
      actions.togglePause();
    } else {
      // About to hide settings
      actions.togglePause();
    }
    setShowSettings(!showSettings);
  };

  const toggleHelp = () => {
    if (!showHelp) {
      // About to show help
      setPreviousPauseState(state.isPaused);
      actions.togglePause();
    } else {
      // About to hide help
      actions.togglePause();
    }
    setShowHelp(!showHelp);
  };

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
              {state.isPaused ? '▶️' : '⏸️'}
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

      {/* Add Help Modal */}
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
    </div>
  );
};

export default KanaGame;
