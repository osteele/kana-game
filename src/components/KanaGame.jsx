import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Settings } from 'lucide-react';

// Initial kana sets organized by difficulty level
const KANA_SETS = {
  1: [
    { hiragana: 'あ', romaji: 'a' },
    { hiragana: 'い', romaji: 'i' },
    { hiragana: 'う', romaji: 'u' },
    { hiragana: 'え', romaji: 'e' },
    { hiragana: 'お', romaji: 'o' },
  ],
  2: [
    { hiragana: 'か', romaji: 'ka' },
    { hiragana: 'き', romaji: 'ki' },
    { hiragana: 'く', romaji: 'ku' },
    { hiragana: 'け', romaji: 'ke' },
    { hiragana: 'こ', romaji: 'ko' },
  ],
  // Add more sets as needed
};

const KanaGame = () => {
  // Game state
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('kanaGameLevel');
    return saved ? parseInt(saved) : 1;
  });
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKana, setCurrentKana] = useState(null);
  const [position, setPosition] = useState({ x: 50, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(5000); // Time for kana to fall (ms)
  const [choices, setChoices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);

  const timerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize or reset game state
  const initializeGame = useCallback(() => {
    const currentSet = KANA_SETS[level];
    const kana = currentSet[Math.floor(Math.random() * currentSet.length)];

    // Generate choices including the correct answer and random others
    const allKana = Object.values(KANA_SETS).flat();
    const wrongChoices = allKana
      .filter(k => k.romaji !== kana.romaji)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    const allChoices = [...wrongChoices, kana]
      .sort(() => Math.random() - 0.5);

    setCurrentKana(kana);
    setChoices(allChoices);
    setPosition({ x: 50, y: 0 });
    setFeedback(null);
    setIsWaitingForNext(false);
  }, [level]);

  // Start game timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  // Save level to localStorage
  useEffect(() => {
    localStorage.setItem('kanaGameLevel', level.toString());
  }, [level]);

  // Handle animation frame updates for falling kana
  const animate = useCallback(() => {
    if (isPlaying && !isWaitingForNext) {
      setPosition(prev => ({
        ...prev,
        y: prev.y + (100 / (gameSpeed / 16.67)) // Smooth falling motion
      }));
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, gameSpeed, isWaitingForNext]);

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

  // Check for collision with bottom
  useEffect(() => {
    if (position.y >= 80 && !isWaitingForNext) {
      const column = Math.floor((position.x / 100) * 5);
      const isCorrect = choices[column].romaji === currentKana.romaji;

      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1)
      }));

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
  }, [position.y, choices, currentKana, isPlaying, initializeGame]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || isWaitingForNext) return;

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
    if (!isPlaying || isWaitingForNext) return;
    const targetX = (index / 5) * 100 + 10;
    setPosition(prev => ({ ...prev, x: targetX }));
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

  return (
    <div className="w-full h-full max-w-2xl mx-auto p-4 select-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <Clock className="w-5 h-5" />
          <span className="text-lg">{formatTime(elapsedTime)}</span>
          <div className="text-lg">
            ✓ {score.correct} | ✗ {score.wrong}
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <div className="flex items-center space-x-4">
            <label>Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="p-2 border rounded"
            >
              {Object.keys(KANA_SETS).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
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
              className="absolute text-4xl transform -translate-x-1/2"
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
