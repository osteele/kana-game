import { useCallback, useEffect, useState } from "react";

export interface FallenCharacter {
  text: string;
  x: number;
  y: number;
  rotation: number;
  feedback: boolean;
  velocity: number;
  amplitude: number;
  frequency: number;
  initialX: number;
}

export const useFallingCharacters = (
  isPlaying: boolean,
  isGamePaused: boolean,
  isShowingFeedback: boolean
) => {
  const [fallenCharacters, setFallenCharacters] = useState<FallenCharacter[]>(
    []
  );
  const [driftOffset, setDriftOffset] = useState({ x: 0, phase: 0 });

  useEffect(() => {
    if (!isPlaying || isGamePaused || isShowingFeedback) return;

    const animateFrame = () => {
      setDriftOffset((prev) => ({
        x: Math.sin(prev.phase) * 2.5,
        phase: prev.phase + 0.01,
      }));
    };

    const animationFrame = requestAnimationFrame(animateFrame);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, isGamePaused, isShowingFeedback]);

  const addFallenCharacter = useCallback(
    (kana: string, x: number, isCorrect: boolean) => {
      const initialX = x;
      setFallenCharacters((prev) => [
        ...prev,
        {
          text: kana,
          x: initialX,
          initialX,
          y: 0,
          rotation: Math.random() * 360,
          feedback: isCorrect,
          velocity: 0.03 + Math.random() * 0.02,
          amplitude: 3 + Math.random() * 2,
          frequency: 0.002 + Math.random() * 0.001,
        },
      ]);
    },
    []
  );

  return {
    fallenCharacters,
    setFallenCharacters,
    driftOffset,
    addFallenCharacter,
  };
};
