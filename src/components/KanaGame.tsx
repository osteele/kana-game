import { useCallback, useEffect, useRef, useState } from "react";
import { tsParticles } from "tsparticles-engine";
import { loadConfettiPreset } from "tsparticles-preset-confetti";
import { loadFireworksPreset } from "tsparticles-preset-fireworks";
import { useFallingCharacters } from "../effects/FallingCharacters";
import { useGameAudio } from "../effects/GameSound";
import {
  PARTICLE_CONFIGS,
  ParticleEffectType,
} from "../effects/ParticleEffects";
import { useSpeechSynthesis } from "../effects/SpeechSynthesis";
import { ROUND_COMPLETE_THRESHOLD, useGameStore } from "../store/gameStore";
import { KanaStatsMap } from "../stats";
import { AnswerColumns } from "./AnswerColumns";
import { GameHeader } from "./GameHeader";
import { HelpModal } from "./HelpModal";
import Settings from "./Settings";

const ErrorAlert = ({ message }: { message: string }) => (
  <div role="alert" className="alert alert-error mb-4">
    <span>{message}</span>
  </div>
);

const KanaGame = () => {
  const gameStore = useGameStore();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<Timer | null>(null);

  const [characterStats, setCharacterStats] = useState<KanaStatsMap>(() => {
    const saved = localStorage.getItem("kanaGameStats");
    return saved ? JSON.parse(saved) : {};
  });

  const [error, setError] = useState<string | null>(null);
  const [showKanaDetails, setShowKanaDetails] = useState(false);
  
  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);

  // Animation loop
  const animate = useCallback(() => {
    gameStore.animateFrame();
    gameStore.checkLanding();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Handle animation lifecycle
  useEffect(() => {
    if (gameStore.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStore.isPlaying, animate]);

  useEffect(() => {
    try {
      localStorage.setItem("kanaGameStats", JSON.stringify(characterStats));
    } catch (err) {
      setError(
        `Failed to save game stats: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }, [characterStats]);

  // Start game timer
  useEffect(() => {
    if (gameStore.isPlaying && !gameStore.isGamePaused) {
      timerRef.current = setInterval(() => {
        gameStore.tickTimer();
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStore.isPlaying, gameStore.isGamePaused]);

  // Save level to localStorage
  useEffect(() => {
    localStorage.setItem("kanaGameLevel", gameStore.level.toString());
  }, [gameStore.level]);

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
      const duration = type === "roundComplete" ? 5000 : 2000;

      tsParticles
        .load(`${type}Particles`, config)
        .then((container) => {
          if (container) {
            setTimeout(() => {
              container.destroy();
            }, duration);
          }
        })
        .catch((err) => {
          setError(
            `Failed to load particle effects: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        });
    } catch (err) {
      setError(
        `Particle effect error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }, []);

  const { speechEnabled, setSpeechEnabled, speakKana } = useSpeechSynthesis();

  const { fallenCharacters, driftOffset, addFallenCharacter } =
    useFallingCharacters(
      gameStore.isPlaying,
      gameStore.isGamePaused,
      gameStore.isShowingFeedback
    );

  useEffect(() => {
    if (gameStore.feedback && gameStore.currentKana) {
      const column = Math.floor((gameStore.position.x / 100) * 5);
      const initialX = column * 20 + 10;
      addFallenCharacter(
        gameStore.currentKana.kana,
        initialX,
        gameStore.feedback.isCorrect
      );

      if (gameStore.feedback?.isCorrect) {
        speakKana(gameStore.feedback.message.ja);
        gameAudio.playSuccess();
        triggerParticleEffect("success");

        if (
          gameStore.score.correct > 0 &&
          gameStore.score.correct % ROUND_COMPLETE_THRESHOLD === 0
        ) {
          gameAudio.playRoundComplete();
          triggerParticleEffect("roundComplete");

          gameStore.setPaused(true);
          tsParticles
            .load("roundCompleteParticles", {
              preset: "fireworks",
              particles: {
                number: { value: 10 },
                life: { duration: 3 },
              },
            })
            .then((container) => {
              setTimeout(() => {
                container?.destroy();
                gameStore.setPaused(false);
              }, 5000);
            });

          gameStore.handleAnswer(
            true,
            `Round Complete! Score: ${gameStore.score.correct}`
          );

          setTimeout(() => {
            if (gameStore.isPlaying) {
              gameStore.initializeRound();
            }
          }, 1000); // Longer delay for round completion
          return; // Exit early to prevent normal feedback
        }
      } else {
        const guess = gameStore.feedback?.guess?.kana;
        if (guess) {
          speakKana(gameStore.feedback.message.ja);
        }
        gameAudio.playFailure();
        triggerParticleEffect("failure");
      }

      // Update character stats
      setCharacterStats((prev) => {
        const key = `${gameStore.currentKana?.kana}`;
        const existing = prev[key] || { correct: 0, wrong: 0 };
        return {
          ...prev,
          [key]: {
            correct: existing.correct + (gameStore.feedback?.isCorrect ? 1 : 0),
            wrong: existing.wrong + (gameStore.feedback?.isCorrect ? 0 : 1),
            lastSeen: Date.now(),
          },
        };
      });

      // Auto-advance after delay
      setTimeout(() => {
        if (gameStore.isPlaying) {
          gameStore.initializeRound();
        }
      }, 2000);
    }
  }, [gameStore.feedback, speakKana, addFallenCharacter]);

  const findNextColumnByLetter = (
    currentX: number,
    letter: string,
    choices: { romaji: string }[]
  ): number | null => {
    // Convert letter to lowercase for case-insensitive matching
    letter = letter.toLowerCase();

    // Find all matching columns
    const matchingColumns = choices
      .map((choice, index) => ({ index, romaji: choice.romaji }))
      .filter(({ romaji }) => romaji.toLowerCase().startsWith(letter));

    if (matchingColumns.length === 0) return null;

    // Get current column index (0-4)
    const currentColumn = Math.floor((currentX / 100) * 5);

    // Find the next matching column after the current one
    const nextMatch = matchingColumns.find(
      ({ index }) => index > currentColumn
    );

    // If found, return that column, otherwise return the first matching column
    return nextMatch ? nextMatch.index : matchingColumns[0].index;
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStore.isPlaying || showHelp || showSettings) return;
      if (gameStore.isGamePaused || gameStore.isShowingFeedback) return;

      switch (e.key) {
        case "ArrowLeft":
          gameStore.updatePosition(
            Math.max(0, gameStore.position.x - 5),
            gameStore.position.y
          );
          break;
        case "ArrowRight":
          gameStore.updatePosition(gameStore.position.x + 5);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          const columnIndex = parseInt(e.key) - 1;
          const targetX = columnIndex * 20 + 10;
          gameStore.updatePosition(targetX);
          break;
        // @ts-expect-error Intentional fallthrough
        case " ":
          if (gameStore.isGamePaused) {
            gameStore.setPaused(false);
            e.preventDefault();
            return;
          }
        // fallthrough
        case "Enter":
        case "ArrowDown":
          if (!gameStore.isGamePaused) {
            if (gameStore.isShowingFeedback) {
              gameStore.initializeRound();
            } else {
              gameStore.updatePosition(undefined, 80);
            }
          }
          break;
        default:
          // Handle letter keys
          if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
            const nextColumn = findNextColumnByLetter(
              gameStore.position.x,
              e.key,
              gameStore.choices
            );
            if (nextColumn !== null) {
              const targetX = nextColumn * 20 + 10;
              gameStore.updatePosition(targetX);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    gameStore.isPlaying,
    gameStore.isShowingFeedback,
    gameStore.isGamePaused,
    gameStore.position,
    gameStore.choices,
    showHelp,
    showSettings
  ]);

  // Handle column click/tap
  const handleColumnClick = (index: number) => {
    if (!gameStore.isPlaying || gameStore.isShowingFeedback || gameStore.isGamePaused)
      return;
    const targetX = index * 20 + 10; // 20% per column, centered at 10%

    // Get current column based on x position
    const currentColumn = Math.floor((gameStore.position.x / 100) * 5);

    if (currentColumn === index) {
      // If clicking current column, drop to bottom
      gameStore.updatePosition(targetX, 80);
    } else {
      // If clicking different column, just move horizontally
      gameStore.updatePosition(targetX);
    }
  };

  const startGame = useCallback(() => {
    try {
      gameAudio.initializeAudio();
      gameStore.startGame();
      gameStore.initializeRound();
      setError(null);
    } catch (err) {
      setError(
        `Failed to start game: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error(err);
    }
  }, [gameAudio]);

  const togglePause = useCallback(() => {
    if (gameStore.isGamePaused) {
      gameStore.popPause();
    } else {
      gameStore.pushPause();
    }
  }, []);

  const toggleSettings = useCallback(() => {
    if (!showSettings) {
      gameStore.pushPause();
    } else {
      gameStore.popPause();
    }
    setShowSettings(!showSettings);
  }, [showSettings]);

  const toggleHelp = useCallback(() => {
    if (!showHelp) {
      gameStore.pushPause();
    } else {
      gameStore.popPause();
    }
    setShowHelp(!showHelp);
  }, [showHelp]);

  // Add global keyboard handlers for help
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      switch (e.key) {
        case "?":
          if (!showSettings) {
            toggleHelp();
          }
          break;
        case "Escape":
          if (showHelp) {
            toggleHelp();
          } else if (showSettings) {
            toggleSettings();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [showHelp, showSettings, toggleHelp, toggleSettings]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (gameStore.isPlaying && document.hidden) {
        gameStore.pushPause();
      }
    };

    const handleFocus = () => {
      if (gameStore.isPlaying && document.hidden === false) {
        gameStore.popPause();
      }
    };

    const handleBlur = () => {
      if (gameStore.isPlaying) {
        gameStore.pushPause();
      }
    };

    // Add all event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [gameStore.isPlaying]);

  return (
    <div className="w-full h-full max-w-2xl mx-auto p-2 sm:p-4 select-none">
      {/* Add particle containers */}
      <div
        id="successParticles"
        ref={successParticlesRef}
        className="fixed inset-0 pointer-events-none z-50"
      />
      <div
        id="failureParticles"
        ref={failureParticlesRef}
        className="fixed inset-0 pointer-events-none z-50"
      />
      <div
        id="roundCompleteParticles"
        ref={roundCompleteParticlesRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      {/* Replace header with GameHeader component */}
      <GameHeader
        elapsedTime={gameStore.elapsedTime}
        score={gameStore.score}
        isPlaying={gameStore.isPlaying}
        isGamePaused={gameStore.isGamePaused}
        onTogglePause={togglePause}
        onToggleHelp={toggleHelp}
        onToggleSettings={toggleSettings}
      />

      {error && <ErrorAlert message={error} />}

      {/* Replace help modal with HelpModal component */}
      {showHelp && <HelpModal onClose={toggleHelp} />}

      {/* Settings panel */}
      {showSettings && (
        <Settings
          level={gameStore.level}
          setLevel={gameStore.setLevel}
          writingSystem={gameStore.writingSystem}
          setWritingSystem={gameStore.setWritingSystem}
          showKanaDetails={showKanaDetails}
          setShowKanaDetails={setShowKanaDetails}
          speedSetting={gameStore.speedSetting}
          setSpeedSetting={gameStore.setSpeedSetting}
          speechEnabled={speechEnabled}
          setSpeechEnabled={setSpeechEnabled}
          onClose={toggleSettings}
        />
      )}

      {/* Game Area */}
      {!gameStore.isPlaying ? (
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
          {gameStore.currentKana && (
            <div
              className={`
                absolute text-4xl transform -translate-x-1/2 z-20
                ${
                  gameStore.isShowingFeedback && gameStore.feedback?.isCorrect
                    ? "text-green-600"
                    : gameStore.isShowingFeedback
                    ? "text-red-600"
                    : "bg-gradient-to-br from-[#2d5a27] to-[#8B4513] bg-clip-text text-transparent"
                }
                font-bold drop-shadow-md
                transition-[left] duration-300 ease-in-out
              `}
              style={{
                left: `${gameStore.position.x + driftOffset.x}%`,
                top: `calc(${gameStore.position.y}% - 3rem)`,
                transform: "translateX(-50%)",
              }}
            >
              {gameStore.currentKana.kana}
            </div>
          )}

          {/* Answer columns component */}
          <AnswerColumns
            choices={gameStore.choices}
            position={gameStore.position}
            currentKana={gameStore.currentKana}
            isShowingFeedback={gameStore.isShowingFeedback}
            onColumnClick={handleColumnClick}
          />

          {/* Feedback message */}
          {gameStore.feedback && (
            <div
              className={`
                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                text-xl serif feedback-message
                ${gameStore.feedback.isCorrect ? "text-green-500" : "text-red-500"}
              `}
              dangerouslySetInnerHTML={{ __html: gameStore.feedback.message.en }}
            />
          )}
        </div>
      )}

      {/* Fallen Characters */}
      <div className="h-20 w-full relative overflow-hidden">
        {fallenCharacters.map((char, index) => (
          <div
            key={`${index}-${char.text}`}
            className={`
              absolute text-2xl font-['Yusei_Magic']
              ${char.feedback ? "text-green-800" : "text-red-800"}
              transition-transform duration-100 ease-in-out
            `}
            style={{
              left: `${char.x}%`,
              top: `${char.y}%`,
              transform: `translate(-50%, -50%) rotate(${char.rotation}deg)`,
              opacity: Math.max(0, 1 - char.y / 100),
            }}
          >
            {char.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanaGame;