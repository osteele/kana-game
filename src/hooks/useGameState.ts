import { useCallback, useEffect, useReducer, useRef } from 'react';
import { CharacterSet, getKanaSets, getSimilarCharacters, Kana } from '../kana/kana';
import { KanaStatsMap } from '../stats';

// Define state interface
interface GameState {
  level: number;
  round: number;
  score: { correct: number; wrong: number };
  elapsedTime: number;
  isPlaying: boolean;
  isPaused: boolean;
  isWaitingForNext: boolean;
  currentKana: Kana | null;
  position: { x: number; y: number };
  velocity: number;
  feedback: { isCorrect: boolean; character: string; message: string } | null;
  writingSystem: CharacterSet;
  choices: Kana[];
  characterStats: KanaStatsMap;
  speedSetting: 'slow' | 'normal' | 'fast';
  pauseStack: boolean[];  // Stack of previous pause states
}

// Define action types
type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'UPDATE_POSITION'; payload: { x?: number; y?: number } }
  | { type: 'SET_VELOCITY'; payload: number }
  | { type: 'SET_LEVEL'; payload: number }
  | { type: 'UPDATE_SCORE'; payload: { isCorrect: boolean } }
  | { type: 'SET_FEEDBACK'; payload: { isCorrect: boolean; character: string; message: string } | null }
  | { type: 'SET_WAITING'; payload: boolean }
  | { type: 'SET_KANA'; payload: { currentKana: Kana; choices: Kana[] } }
  | { type: 'SET_WRITING_SYSTEM'; payload: CharacterSet }
  | { type: 'TICK_TIMER' }
  | { type: 'UPDATE_CHARACTER_STATS'; payload: { character: string; isCorrect: boolean } }
  | {
    type: 'INITIALIZE_ROUND'; payload: {
      currentKana: Kana;
      choices: Kana[];
    }
  }
  | { type: 'SET_SPEED_SETTING'; payload: 'slow' | 'normal' | 'fast' }
  | { type: 'CHECK_LANDING' }
  | { type: 'ANIMATE_FRAME' }
  | { type: 'PUSH_PAUSE' }
  | { type: 'POP_PAUSE' };

// Create initial state
const initialState: GameState = {
  level: parseInt(localStorage.getItem('kanaGameLevel') || '1'),
  round: 0,
  score: { correct: 0, wrong: 0 },
  elapsedTime: 0,
  isPlaying: false,
  isPaused: false,
  isWaitingForNext: false,
  currentKana: null,
  position: { x: 50, y: 0 },
  velocity: 0,
  feedback: null,
  writingSystem: 'hiragana',
  choices: [],
  characterStats: {},
  speedSetting: 'normal',
  pauseStack: [],
};

export const LANDING_HEIGHT = 85;

export const ACCELERATION_RATES = {
  slow: 0.0025,
  normal: 0.005,
  fast: 0.01
};

const getInitialVelocity = (speedSetting: 'slow' | 'normal' | 'fast'): number => {
  switch (speedSetting) {
    case 'slow': return 0.05;
    case 'normal': return 0.1;
    case 'fast': return 0.15;
  }
};

// Create reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        isPlaying: true,
        score: { correct: 0, wrong: 0 },
        elapsedTime: 0,
        position: { x: 50, y: 0 },
        velocity: 0,
        feedback: null
      };

    case 'PAUSE_GAME':
      return { ...state, isPaused: true };

    case 'RESUME_GAME':
      return { ...state, isPaused: false };

    case 'SET_VELOCITY':
      return { ...state, velocity: action.payload };

    case 'SET_LEVEL':
      localStorage.setItem('kanaGameLevel', action.payload.toString());
      return { ...state, level: action.payload };

    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };

    case 'SET_WAITING':
      return { ...state, isWaitingForNext: action.payload };

    case 'SET_KANA':
      return {
        ...state,
        currentKana: action.payload.currentKana,
        choices: action.payload.choices
      };

    case 'SET_WRITING_SYSTEM':
      return { ...state, writingSystem: action.payload };

    case 'TICK_TIMER':
      return { ...state, elapsedTime: state.elapsedTime + 1 };

    case 'UPDATE_CHARACTER_STATS':
      return {
        ...state,
        characterStats: {
          ...state.characterStats,
          [action.payload.character]: {
            correct: (state.characterStats[action.payload.character]?.correct || 0) + (action.payload.isCorrect ? 1 : 0),
            wrong: (state.characterStats[action.payload.character]?.wrong || 0) + (action.payload.isCorrect ? 0 : 1)
          }
        }
      };

    case 'UPDATE_POSITION':
      return {
        ...state,
        position: {
          x: action.payload.x ?? state.position.x,
          y: action.payload.y ?? state.position.y
        }
      };

    case 'UPDATE_SCORE':
      return {
        ...state,
        score: {
          correct: state.score.correct + (action.payload.isCorrect ? 1 : 0),
          wrong: state.score.wrong + (action.payload.isCorrect ? 0 : 1)
        }
      };

    case 'INITIALIZE_ROUND':
      return {
        ...state,
        currentKana: action.payload.currentKana,
        round: state.round + 1,
        choices: action.payload.choices,
        position: { x: 50, y: 0 },
        velocity: getInitialVelocity(state.speedSetting),
        feedback: null,
        isWaitingForNext: false
      };

    case 'SET_SPEED_SETTING':
      return { ...state, speedSetting: action.payload };

    case 'CHECK_LANDING': {
      if (state.position.y >= LANDING_HEIGHT && !state.isWaitingForNext && state.currentKana) {
        const column = Math.floor((state.position.x / 100) * 5);
        const isCorrect = state.choices[column].romaji === state.currentKana.romaji;
        return {
          ...state,
          isWaitingForNext: true,
          feedback: {
            isCorrect,
            character: state.currentKana.text,
            message: isCorrect ? 'Correct!' : `Incorrect. The answer was “${state.currentKana.romaji}”`
          },
          score: {
            correct: state.score.correct + (isCorrect ? 1 : 0),
            wrong: state.score.wrong + (isCorrect ? 0 : 1)
          }
        };
      }
      return state;
    }

    case 'ANIMATE_FRAME': {
      if (!state.isPlaying || state.isWaitingForNext || state.isPaused) {
        return state;
      }
      const accelerationRate = ACCELERATION_RATES[state.speedSetting];
      const newVelocity = state.velocity + accelerationRate;
      const newY = Math.min(state.position.y + newVelocity, LANDING_HEIGHT);

      return {
        ...state,
        velocity: newVelocity,
        position: {
          ...state.position,
          y: newY
        }
      };
    }

    case 'PUSH_PAUSE': {
      return {
        ...state,
        pauseStack: [...state.pauseStack, state.isPaused],
        isPaused: true,
      };
    }

    case 'POP_PAUSE': {
      const newStack = [...state.pauseStack];
      const previousPauseState = newStack.pop() ?? false;
      return {
        ...state,
        pauseStack: newStack,
        isPaused: previousPauseState,
      };
    }

    default:
      return state;
  }
}

// Create custom hook
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const animationFrameRef = useRef<number | null>(null);

  // Add animation loop
  const animate = useCallback(() => {
    dispatch({ type: 'ANIMATE_FRAME' });
    dispatch({ type: 'CHECK_LANDING' });
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Handle animation lifecycle
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

  // Create action dispatchers
  const actions = {
    startGame: useCallback(() => dispatch({ type: 'START_GAME' }), []),

    togglePause: useCallback(() => {
      dispatch({ type: state.isPaused ? 'RESUME_GAME' : 'PAUSE_GAME' });
    }, [state.isPaused]),

    setPaused: useCallback((paused: boolean) => {
      dispatch({ type: paused ? 'PAUSE_GAME' : 'RESUME_GAME' });
    }, []),

    updatePosition: useCallback((x?: number, y?: number) => {
      dispatch({
        type: 'UPDATE_POSITION',
        payload: {
          x: x !== undefined ? Math.max(0, Math.min(100, x)) : undefined,
          y: y !== undefined ? Math.max(0, Math.min(LANDING_HEIGHT, y)) : undefined
        }
      });
    }, []),

    handleAnswer: useCallback((isCorrect: boolean, message: string) => {
      dispatch({ type: 'UPDATE_SCORE', payload: { isCorrect } });
      dispatch({ type: 'SET_FEEDBACK', payload: { isCorrect, character: state.currentKana!.text, message } });
      dispatch({ type: 'SET_WAITING', payload: true });
    }, []),

    setKana: useCallback((currentKana: Kana, choices: Kana[]) => {
      dispatch({ type: 'SET_KANA', payload: { currentKana, choices } });
    }, []),

    setLevel: useCallback((level: number) => {
      dispatch({ type: 'SET_LEVEL', payload: level });
    }, []),

    setVelocity: useCallback((velocity: number) => {
      dispatch({ type: 'SET_VELOCITY', payload: velocity });
    }, []),

    setWaitingForNext: useCallback((waiting: boolean) => {
      dispatch({ type: 'SET_WAITING', payload: waiting });
    }, []),

    setWritingSystem: useCallback((writingSystem: CharacterSet) => {
      dispatch({ type: 'SET_WRITING_SYSTEM', payload: writingSystem });
    }, []),

    tickTimer: useCallback(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, []),

    updateCharacterStats: useCallback((character: string, isCorrect: boolean) => {
      dispatch({ type: 'UPDATE_CHARACTER_STATS', payload: { character, isCorrect } });
    }, []),

    initializeRound: useCallback(() => {
      const currentSet = getKanaSets(state.level, state.writingSystem);
      const kana = currentSet[Math.floor(Math.random() * currentSet.length)];
      const similarChars = getSimilarCharacters(kana.text);
      const choices = generateChoices(kana, state.level, state.writingSystem, similarChars);

      dispatch({
        type: 'INITIALIZE_ROUND',
        payload: { currentKana: kana, choices }
      });
    }, [state.level, state.writingSystem]),

    setSpeedSetting: useCallback((speed: 'slow' | 'normal' | 'fast') => {
      dispatch({ type: 'SET_SPEED_SETTING', payload: speed });
    }, []),

    pushPause: useCallback(() => {
      dispatch({ type: 'PUSH_PAUSE' });
    }, []),

    popPause: useCallback(() => {
      dispatch({ type: 'POP_PAUSE' });
    }, []),
  };

  return { state, actions, dispatch };
}

const generateChoices = (
  kana: Kana,
  level: number,
  writingSystem: CharacterSet,
  similarChars: string[]
): Kana[] => {
  const allKana = getKanaSets(level, writingSystem);

  const visuallySimularKana = similarChars
    .map(char => allKana.find(k => k.text === char))
    .filter((k): k is Kana => k !== undefined);

  const availableKana = Array.from({ length: level }, (_, i) =>
    getKanaSets(i + 1, writingSystem)
  ).flat();

  const wrongChoices = availableKana
    .filter(k => k.romaji !== kana.romaji)
    .sort(() => Math.random() - 0.5);

  let distractors: Kana[] = [];

  if (visuallySimularKana.length > 0) {
    distractors = visuallySimularKana
      .filter(k => k.romaji !== kana.romaji)
      .slice(0, 2);
  }

  distractors = [
    ...distractors,
    ...wrongChoices.filter(k => !distractors.some(d => d.romaji === k.romaji))
  ].slice(0, 4);

  return [...distractors, kana].sort(() => Math.random() - 0.5);
};
