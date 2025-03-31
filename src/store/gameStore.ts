import { create } from 'zustand';
import { produce } from 'immer';
import {
  CharacterSet,
  getKanaSets,
  getSimilarCharacters,
  Kana,
} from "../kana/kana";
import { KanaStatsMap } from "../stats";

// Constants
export const ROUND_COMPLETE_THRESHOLD = 10;
export const LANDING_HEIGHT = 85;

export const ACCELERATION_RATES = {
  slow: 0.0025,
  normal: 0.005,
  fast: 0.01,
};

const getInitialVelocity = (
  speedSetting: "slow" | "normal" | "fast"
): number => {
  switch (speedSetting) {
    case "slow":
      return 0.05;
    case "normal":
      return 0.1;
    case "fast":
      return 0.15;
  }
};

// State interface
interface GameState {
  level: number;
  round: number;
  score: { correct: number; wrong: number };
  elapsedTime: number;
  isPlaying: boolean;
  isGamePaused: boolean;
  isShowingFeedback: boolean;
  currentKana: Kana | null;
  position: { x: number; y: number };
  velocity: number;
  feedback: {
    isCorrect: boolean;
    character: string;
    message: { en: string; ja: string };
    guess?: Kana;
  } | null;
  writingSystem: CharacterSet;
  choices: Kana[];
  characterStats: KanaStatsMap;
  speedSetting: "slow" | "normal" | "fast";
  pauseStack: boolean[];
  lastCorrectKana: string | null;

  // Actions
  startGame: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  updatePosition: (x?: number, y?: number) => void;
  handleAnswer: (isCorrect: boolean, message: string, selectedKana?: string) => void;
  setKana: (currentKana: Kana, choices: Kana[]) => void;
  setLevel: (level: number) => void;
  setVelocity: (velocity: number) => void;
  setWaitingForNext: (waiting: boolean) => void;
  setWritingSystem: (writingSystem: CharacterSet) => void;
  tickTimer: () => void;
  updateCharacterStats: (character: string, isCorrect: boolean) => void;
  initializeRound: () => void;
  setSpeedSetting: (speed: "slow" | "normal" | "fast") => void;
  pushPause: () => void;
  popPause: () => void;
  animateFrame: () => void;
  checkLanding: () => void;
}

// Helper function to generate choices
const generateChoices = (
  kana: Kana,
  level: number,
  writingSystem: CharacterSet,
  similarChars: string[],
  lastCorrectKana?: string | null
): Kana[] => {
  const allKana = getKanaSets(level, writingSystem).filter(
    (k) => k.kana !== lastCorrectKana
  );

  // If we filtered out all characters, fall back to the full set
  if (allKana.length === 0) {
    return generateChoices(kana, level, writingSystem, similarChars);
  }

  const visuallySimularKana = similarChars
    .map((char) => allKana.find((k) => k.kana === char))
    .filter((k): k is Kana => k !== undefined);

  const availableKana = Array.from({ length: level }, (_, i) =>
    getKanaSets(i + 1, writingSystem)
  ).flat();

  const wrongChoices = availableKana
    .filter((k) => k.romaji !== kana.romaji)
    .sort(() => Math.random() - 0.5);

  let distractors: Kana[] = [];

  if (visuallySimularKana.length > 0) {
    distractors = visuallySimularKana
      .filter((k) => k.romaji !== kana.romaji)
      .slice(0, 2);
  }

  distractors = [
    ...distractors,
    ...wrongChoices.filter(
      (k) => !distractors.some((d) => d.romaji === k.romaji)
    ),
  ].slice(0, 4);

  return [...distractors, kana].sort(() => Math.random() - 0.5);
};

// Create store with Zustand
export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  level: parseInt(localStorage.getItem("kanaGameLevel") || "1"),
  round: 0,
  score: { correct: 0, wrong: 0 },
  elapsedTime: 0,
  isPlaying: false,
  isGamePaused: false,
  isShowingFeedback: false,
  currentKana: null,
  position: { x: 50, y: 0 },
  velocity: 0,
  feedback: null,
  writingSystem: "hiragana",
  choices: [],
  characterStats: {},
  speedSetting: "normal",
  pauseStack: [],
  lastCorrectKana: null,

  // Actions
  startGame: () => set(produce((state) => {
    state.isPlaying = true;
    state.score = { correct: 0, wrong: 0 };
    state.elapsedTime = 0;
    state.position = { x: 50, y: 0 };
    state.velocity = 0;
    state.feedback = null;
  })),

  togglePause: () => {
    const { isGamePaused } = get();
    set({ isGamePaused: !isGamePaused });
  },

  setPaused: (paused) => set({ isGamePaused: paused }),

  updatePosition: (x, y) => set(produce((state) => {
    if (x !== undefined) {
      state.position.x = Math.max(0, Math.min(100, x));
    }
    if (y !== undefined) {
      state.position.y = Math.max(0, Math.min(LANDING_HEIGHT, y));
    }
  })),

  handleAnswer: (isCorrect, message, selectedKana) => set(produce((state) => {
    state.feedback = {
      isCorrect,
      character: state.currentKana?.kana ?? "",
      message: { en: message, ja: message },
      guess: selectedKana
        ? { kana: selectedKana, romaji: selectedKana }
        : undefined,
    };
    state.score.correct += isCorrect ? 1 : 0;
    state.score.wrong += isCorrect ? 0 : 1;
    state.isShowingFeedback = true;
  })),

  setKana: (currentKana, choices) => set({ currentKana, choices }),

  setLevel: (level) => {
    localStorage.setItem("kanaGameLevel", level.toString());
    set({ level });
  },

  setVelocity: (velocity) => set({ velocity }),

  setWaitingForNext: (waiting) => set({ isShowingFeedback: waiting }),

  setWritingSystem: (writingSystem) => set({ writingSystem }),

  tickTimer: () => set((state) => ({ elapsedTime: state.elapsedTime + 1 })),

  updateCharacterStats: (character, isCorrect) => set(produce((state) => {
    const existing = state.characterStats[character] || { correct: 0, wrong: 0 };
    state.characterStats[character] = {
      correct: existing.correct + (isCorrect ? 1 : 0),
      wrong: existing.wrong + (isCorrect ? 0 : 1),
      lastSeen: Date.now(),
    };
  })),

  initializeRound: () => {
    const state = get();
    const currentSet = getKanaSets(state.level, state.writingSystem)
      .filter((k) => k.kana !== state.lastCorrectKana);

    // If we filtered out all characters, fall back to the full set
    const availableSet =
      currentSet.length > 0
        ? currentSet
        : getKanaSets(state.level, state.writingSystem);

    const kana = availableSet[Math.floor(Math.random() * availableSet.length)];
    const similarChars = getSimilarCharacters(kana.kana);
    const choices = generateChoices(
      kana,
      state.level,
      state.writingSystem,
      similarChars,
      state.lastCorrectKana
    );

    set(produce((state) => {
      state.currentKana = kana;
      state.round = state.round + 1;
      state.choices = choices;
      state.position = { x: 50, y: 0 };
      state.velocity = getInitialVelocity(state.speedSetting);
      state.feedback = null;
      state.isShowingFeedback = false;
    }));
  },

  setSpeedSetting: (speed) => set({ speedSetting: speed }),

  pushPause: () => set(produce((state) => {
    state.pauseStack.push(state.isGamePaused);
    state.isGamePaused = true;
  })),

  popPause: () => set(produce((state) => {
    const wasPaused = state.pauseStack.pop() ?? false;
    state.isGamePaused = wasPaused;
  })),

  animateFrame: () => {
    const { isPlaying, isShowingFeedback, isGamePaused, speedSetting, velocity, position } = get();
    
    if (!isPlaying || isShowingFeedback || isGamePaused) {
      return;
    }
    
    const accelerationRate = ACCELERATION_RATES[speedSetting];
    const newVelocity = velocity + accelerationRate;
    const newY = Math.min(position.y + newVelocity, LANDING_HEIGHT);
    
    set({
      velocity: newVelocity,
      position: {
        ...position,
        y: newY,
      }
    });
  },

  checkLanding: () => {
    const state = get();
    if (
      state.position.y >= LANDING_HEIGHT &&
      !state.isShowingFeedback &&
      state.currentKana
    ) {
      const column = Math.floor((state.position.x / 100) * 5);
      const selectedChoice = state.choices[column];
      const isCorrect = selectedChoice.romaji === state.currentKana.romaji;
      const lastCorrectKana = isCorrect
        ? state.currentKana.kana
        : state.lastCorrectKana;
      const message = isCorrect
        ? {
            en: `"${state.currentKana.romaji}" is the correct romaji!`,
            ja: `"${state.currentKana.kana}"が正解です`,
          }
        : {
            en: `"${selectedChoice.romaji}" is incorrect. The correct answer is "${state.currentKana.romaji}".`,
            ja: `"${selectedChoice.kana}"は違います。正解は"${state.currentKana.kana}"です`,
          };
      
      set(produce((state) => {
        state.lastCorrectKana = lastCorrectKana;
        state.isShowingFeedback = true;
        state.feedback = {
          isCorrect,
          character: state.currentKana?.kana ?? "",
          guess: selectedChoice,
          message: {
            en: message.en.replace(
              /"(.+?)"/g,
              '"<span class="romaji">$1</span>"'
            ),
            ja: message.ja.replace(/"/g, " "),
          },
        };
        state.score.correct += isCorrect ? 1 : 0;
        state.score.wrong += isCorrect ? 0 : 1;
      }));
    }
  },
}));