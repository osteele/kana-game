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
import { ROUND_COMPLETE_THRESHOLD, useGameState } from "../hooks/useGameState";
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
  const { state, actions } = useGameState();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<Timer | null>(null);

  const [characterStats, setCharacterStats] = useState<KanaStatsMap>(() => {
    const saved = localStorage.getItem("kanaGameStats");
    return saved ? JSON.parse(saved) : {};
  });

  const [error, setError] = useState<string | null>(null);

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
    if (state.isPlaying && !state.isGamePaused) {
      timerRef.current = setInterval(() => {
        actions.tickTimer();
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isPlaying, state.isGamePaused]);

  // Save level to localStorage
  useEffect(() => {
    localStorage.setItem("kanaGameLevel", state.level.toString());
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
      state.isPlaying,
      state.isGamePaused,
      state.isShowingFeedback
    );

  useEffect(() => {
    if (state.feedback && state.currentKana) {
      const column = Math.floor((state.position.x / 100) * 5);
      const initialX = column * 20 + 10;
      addFallenCharacter(
        state.currentKana.kana,
        initialX,
        state.feedback.isCorrect
      );

      if (state.feedback?.isCorrect) {
        speakKana(state.feedback.message.ja);
        gameAudio.playSuccess();
        triggerParticleEffect("success");

        if (
          state.score.correct > 0 &&
          state.score.correct % ROUND_COMPLETE_THRESHOLD === 0
        ) {
          gameAudio.playRoundComplete();
          triggerParticleEffect("roundComplete");

          actions.setPaused(true);
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
                actions.setPaused(false);
              }, 5000);
            });

          actions.handleAnswer(
            true,
            `Round Complete! Score: ${state.score.correct}`
          );

          setTimeout(() => {
            if (state.isPlaying) {
              actions.initializeRound();
            }
          }, 1000); // Longer delay for round completion
          return; // Exit early to prevent normal feedback
        }
      } else {
        const guess = state.feedback?.guess?.kana;
        if (guess) {
          speakKana(state.feedback.message.ja);
        }
        gameAudio.playFailure();
        triggerParticleEffect("failure");
      }

      // Update character stats
      setCharacterStats((prev) => {
        const key = `${state.currentKana?.kana}`;
        const existing = prev[key] || { correct: 0, wrong: 0 };
        return {
          ...prev,
          [key]: {
            correct: existing.correct + (state.feedback?.isCorrect ? 1 : 0),
            wrong: existing.wrong + (state.feedback?.isCorrect ? 0 : 1),
            lastSeen: Date.now(),
          },
        };
      });

      // Auto-advance after delay
      setTimeout(() => {
        if (state.isPlaying) {
          actions.initializeRound();
        }
      }, 2000);
    }
  }, [state.feedback, speakKana, addFallenCharacter]);

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
      if (!state.isPlaying || showHelp || showSettings) return;
      if (state.isGamePaused || state.isShowingFeedback) return;

      switch (e.key) {
        case "ArrowLeft":
          actions.updatePosition(
            Math.max(0, state.position.x - 5),
            state.position.y
          );
          break;
        case "ArrowRight":
          actions.updatePosition(state.position.x + 5);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          const columnIndex = parseInt(e.key) - 1;
          const targetX = columnIndex * 20 + 10;
          actions.updatePosition(targetX);
          break;
        // @ts-expect-error Intentional fallthrough
        case " ":
          if (state.isGamePaused) {
            actions.setPaused(false);
            e.preventDefault();
            return;
          }
        // fallthrough
        case "Enter":
        case "ArrowDown":
          if (!state.isGamePaused) {
            if (state.isShowingFeedback) {
              actions.initializeRound();
            } else {
              actions.updatePosition(undefined, 80);
            }
          }
          break;
        default:
          // Handle letter keys
          if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
            const nextColumn = findNextColumnByLetter(
              state.position.x,
              e.key,
              state.choices
            );
            if (nextColumn !== null) {
              const targetX = nextColumn * 20 + 10;
              actions.updatePosition(targetX);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.isPlaying,
    state.isShowingFeedback,
    state.isGamePaused,
    state.position,
    state.choices,
  ]);

  // Handle column click/tap
  const handleColumnClick = (index: number) => {
    if (!state.isPlaying || state.isShowingFeedback || state.isGamePaused)
      return;
    const targetX = index * 20 + 10; // 20% per column, centered at 10%

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
      setError(
        `Failed to start game: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error(err);
    }
  }, [actions, gameAudio]);

  const togglePause = useCallback(() => {
    if (state.isGamePaused) {
      actions.popPause();
    } else {
      actions.pushPause();
    }
  }, [actions, state.isGamePaused]);

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
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [state.isPlaying, actions]);

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
        elapsedTime={state.elapsedTime}
        score={state.score}
        isPlaying={state.isPlaying}
        isGamePaused={state.isGamePaused}
        onTogglePause={togglePause}
        onToggleHelp={toggleHelp}
        onToggleSettings={toggleSettings}
      />

      {error && <ErrorAlert message={error} />}

      {/* Replace help modal with HelpModal component */}
      {showHelp && <HelpModal onClose={toggleHelp} />}

      {/* Settings panel remains unchanged */}
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
                ${
                  state.isShowingFeedback && state.feedback?.isCorrect
                    ? "text-green-600"
                    : state.isShowingFeedback
                    ? "text-red-600"
                    : "bg-gradient-to-br from-[#2d5a27] to-[#8B4513] bg-clip-text text-transparent"
                }
                font-bold drop-shadow-md
                transition-[left] duration-300 ease-in-out
              `}
              style={{
                left: `${state.position.x + driftOffset.x}%`,
                top: `calc(${state.position.y}% - 3rem)`,
                transform: "translateX(-50%)",
              }}
            >
              {state.currentKana.kana}
            </div>
          )}

          {/* Replace answer columns with AnswerColumns component */}
          <AnswerColumns
            choices={state.choices}
            position={state.position}
            currentKana={state.currentKana}
            isShowingFeedback={state.isShowingFeedback}
            onColumnClick={handleColumnClick}
          />

          {/* Feedback message remains unchanged */}
          {state.feedback && (
            <div
              className={`
                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                text-xl serif feedback-message
                ${state.feedback.isCorrect ? "text-green-500" : "text-red-500"}
              `}
              dangerouslySetInnerHTML={{ __html: state.feedback.message.en }}
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
