import { Clock, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tsParticles } from "tsparticles-engine";
import { loadConfettiPreset } from "tsparticles-preset-confetti";
import { loadFireworksPreset } from "tsparticles-preset-fireworks";
import { HIRAGANA_SETS } from '../data/hiragana';
import { CharacterSet, getSimilarCharacters, Kana } from "../data/kana";
import { getKanaSets } from "../data/katakana";
import Settings from './Settings';

const ROUND_COMPLETE_THRESHOLD = 10;

// Add new interface for character stats
interface KanaStats {
  correct: number;
  wrong: number;
  lastSeen?: number;
}

interface KanaStatsMap {
  [key: string]: KanaStats;
}

const KanaGame = () => {
  // Game state
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('kanaGameLevel');
    return saved ? parseInt(saved) : 1;
  });
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKana, setCurrentKana] = useState<Kana | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 0 });
  const [velocity, setVelocity] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [choices, setChoices] = useState<Kana[]>([]);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [previousPauseState, setPreviousPauseState] = useState(false);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Add writing system state
  const [writingSystem, setWritingSystem] = useState<CharacterSet>('hiragana');

  // Add stats state
  const [characterStats, setCharacterStats] = useState<KanaStatsMap>(() => {
    const saved = localStorage.getItem('kanaGameStats');
    return saved ? JSON.parse(saved) : {};
  });

  // Update stats storage effect
  useEffect(() => {
    localStorage.setItem('kanaGameStats', JSON.stringify(characterStats));
  }, [characterStats]);

  // Initialize or reset game state
  const initializeGame = useCallback(() => {
    const currentSet = writingSystem === 'hiragana' ? HIRAGANA_SETS[level] : getKanaSets(level, writingSystem);
    const kana = currentSet[Math.floor(Math.random() * currentSet.length)];

    // Get visually similar characters first
    const similarChars = getSimilarCharacters(kana.hiragana);
    let visuallySimularKana: Kana[] = [];

    // Find the Kana objects for visually similar characters
    if (similarChars.length > 0) {
      // Get all kana from all levels
      const allKana = writingSystem === 'hiragana'
        ? Object.values(HIRAGANA_SETS).flat()
        : getKanaSets(Object.keys(HIRAGANA_SETS).length, writingSystem);

      visuallySimularKana = similarChars
        .map(char => allKana.find(k => k.hiragana === char))
        .filter((k): k is Kana => k !== undefined);
    }

    // Generate choices including the correct answer and random others
    // Combine current and previous levels' characters for distractors
    const availableKana = Array.from({ length: level }, (_, i) =>
      writingSystem === 'hiragana' ? HIRAGANA_SETS[i + 1] : getKanaSets(i + 1, writingSystem)
    ).flat();

    // Filter out the correct answer and get random distractors
    const wrongChoices = availableKana
      .filter(k => k.romaji !== kana.romaji)
      .sort(() => Math.random() - 0.5);

    // Prioritize visually similar characters
    let distractors: Kana[] = [];

    // Add up to 2 visually similar characters if available
    if (visuallySimularKana.length > 0) {
      distractors = visuallySimularKana
        .filter(k => k.romaji !== kana.romaji)
        .slice(0, 2);
    }

    // Fill remaining slots with random distractors
    distractors = [
      ...distractors,
      ...wrongChoices.filter(k => !distractors.some(d => d.romaji === k.romaji))
    ].slice(0, 4);

    const allChoices = [...distractors, kana]
      .sort(() => Math.random() - 0.5);

    setCurrentKana(kana);
    setChoices(allChoices);
    setPosition({ x: 50, y: 0 });
    setVelocity(0);
    setFeedback(null);
    setIsWaitingForNext(false);
  }, [level, writingSystem]);

  // Start game timer
  useEffect(() => {
    if (isPlaying && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isPaused]);

  // Save level to localStorage
  useEffect(() => {
    localStorage.setItem('kanaGameLevel', level.toString());
  }, [level]);

  // Handle animation frame updates for falling kana
  const animate = useCallback(() => {
    if (isPlaying && !isWaitingForNext && !isPaused) {
      setPosition(prev => {
        // Base speed (pixels per frame)
        const newVelocity = (velocity + .1) * 2;
        setVelocity(newVelocity);
        // Calculate new position
        const newY = prev.y + newVelocity;

        // Cap the maximum position at 80 to prevent overflow
        return {
          ...prev,
          y: Math.min(newY, 80)
        };
      });
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, isWaitingForNext, isPaused]);

  // Start animation loop
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Add particle container refs
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

  // Add Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Add sound synthesis functions
  const playSuccessSound = useCallback(() => {
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

  const playFailureSound = useCallback(() => {
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

  const playRoundCompleteSound = useCallback(() => {
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

  useEffect(() => {
    if (position.y >= 80 && !isWaitingForNext && currentKana) {
      const column = Math.floor((position.x / 100) * 5);
      const isCorrect = choices[column].romaji === currentKana.romaji;

      // Update score
      const newScore = {
        correct: score.correct + (isCorrect ? 1 : 0),
        wrong: score.wrong + (isCorrect ? 0 : 1)
      };
      setScore(newScore);

      // Play appropriate sound
      if (isCorrect) {
        playSuccessSound();
      } else {
        playFailureSound();
      }

      // Show success/failure particles
      if (isCorrect) {
        tsParticles.load("successParticles", {
          preset: "confetti",
          particles: {
            number: { value: 50 },
            life: { duration: 2 },
          },
        }).then((container) => {
          setTimeout(() => {
            container?.destroy();
          }, 2000);
        });

        // Check for round completion
        if (newScore.correct > 0 && newScore.correct % ROUND_COMPLETE_THRESHOLD === 0) {
          playRoundCompleteSound(); // Play special sound for round completion
          console.log("roundCompleteParticles");

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

          setFeedback({
            isCorrect: true,
            message: `Round Complete! Score: ${newScore.correct}`
          });

          setTimeout(() => {
            if (isPlaying) {
              initializeGame();
            }
          }, 1000); // Longer delay for round completion
          return; // Exit early to prevent normal feedback
        }
      } else {
        tsParticles.load("failureParticles", {
          preset: "confetti",
          particles: {
            color: { value: "#ff0000" },
            number: { value: 30 },
            life: { duration: 1.5 },
          },
        }).then((container) => {
          setTimeout(() => {
            container?.destroy();
          }, 2000);
        });
      }

      // Update character stats
      setCharacterStats(prev => {
        const key = `${currentKana.hiragana}`;
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

      setFeedback({
        isCorrect,
        message: isCorrect ? 'Correct!' : `Incorrect. The answer was "${currentKana.romaji}"`
      });

      setIsWaitingForNext(true);

      // Auto-advance after delay
      setTimeout(() => {
        if (isPlaying) {
          initializeGame();
        }
      }, 2000);
    }
  }, [position.y, choices, currentKana, isPlaying, initializeGame, score]);

  // Add round complete effect
  const showRoundCompleteEffect = useCallback(() => {
    tsParticles.load("roundCompleteParticles", {
      preset: "fireworks",
      particles: {
        number: { value: 10 },
        life: { duration: 3 },
      },
    });
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || showHelp || showSettings) return; // Don't handle game controls if help or settings are showing

      switch (e.key) {
        case 'ArrowLeft':
          setPosition(prev => ({
            ...prev,
            x: Math.max(0, prev.x - 5)
          }));
          break;
        case 'ArrowRight':
          setPosition(prev => ({
            ...prev,
            x: Math.min(100, prev.x + 5)
          }));
          break;
        case ' ':
          if (isWaitingForNext) {
            initializeGame();
          } else {
            setPosition(prev => ({
              ...prev,
              y: 80
            }));
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isWaitingForNext, initializeGame]);

  // Handle column click/tap
  const handleColumnClick = (index) => {
    if (!isPlaying || isWaitingForNext || isPaused) return;
    const targetX = (index * 20) + 10; // 20% per column, centered at 10%

    // Get current column based on x position
    const currentColumn = Math.floor((position.x / 100) * 5);

    if (currentColumn === index) {
      // If clicking current column, drop to bottom
      setPosition(prev => ({ ...prev, x: targetX, y: 80 }));
    } else {
      // If clicking different column, just move horizontally
      setPosition(prev => ({ ...prev, x: targetX }));
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore({ correct: 0, wrong: 0 });
    setElapsedTime(0);
    initializeGame();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Update kana generation to use writing system
  useEffect(() => {
    const availableKana = getKanaSets(level, writingSystem);
    setCurrentKana(availableKana[Math.floor(Math.random() * availableKana.length)]);
  }, [level, writingSystem]);

  // Show kana details state
  const [showKanaDetails, setShowKanaDetails] = useState(false);

  // Modify settings toggle to handle pausing
  const toggleSettings = () => {
    if (!showSettings) {
      // About to show settings
      setPreviousPauseState(isPaused);
      setIsPaused(true);
    } else {
      // About to hide settings
      setIsPaused(previousPauseState);
    }
    setShowSettings(!showSettings);
  };

  const toggleHelp = () => {
    if (!showHelp) {
      // About to show help
      setPreviousPauseState(isPaused);
      setIsPaused(true);
    } else {
      // About to hide help
      setIsPaused(previousPauseState);
    }
    setShowHelp(!showHelp);
  };

  // Add global keyboard handlers for help
  useEffect(() => {
    const handleGlobalKeys = (e) => {
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
    <div className="w-full h-full max-w-2xl mx-auto p-4 select-none">
      {/* Add particle containers */}
      <div id="successParticles" ref={successParticlesRef} className="fixed inset-0 pointer-events-none z-50" />
      <div id="failureParticles" ref={failureParticlesRef} className="fixed inset-0 pointer-events-none z-50" />
      <div id="roundCompleteParticles" ref={roundCompleteParticlesRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <Clock className="w-5 h-5" />
          <span className="text-lg">{formatTime(elapsedTime)}</span>
          <div className="text-lg">
            ✓ {score.correct} | ✗ {score.wrong}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isPlaying && (
            <button
              onClick={togglePause}
              className="p-2 rounded hover:bg-gray-100"
            >
              {isPaused ? '▶️' : '⏸️'}
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
          level={level}
          setLevel={setLevel}
          writingSystem={writingSystem}
          setWritingSystem={setWritingSystem}
          showKanaDetails={showKanaDetails}
          setShowKanaDetails={setShowKanaDetails}
        />
      )}

      {/* Game Area */}
      {!isPlaying ? (
        <div className="text-center mt-20">
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="relative w-full h-96 border-2 border-gray-200 rounded overflow-hidden">
          {/* Falling Kana */}
          {currentKana && (
            <div
              className="absolute text-4xl transform -translate-x-1/2 z-10"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
            >
              {currentKana.hiragana}
            </div>
          )}

          {/* Answer Columns */}
          <div className="absolute bottom-0 w-full flex h-16">
            {choices.map((choice, index) => (
              <div
                key={index}
                onClick={() => handleColumnClick(index)}
                className="flex-1 border-r last:border-r-0 border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
              >
                {choice.romaji}
              </div>
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'
                }`}
            >
              {feedback.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KanaGame;
