import { useCallback, useRef, useState } from 'react';

export function useGameAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAudio = useCallback(() => {
    if (!isInitialized) {
      audioContextRef.current = new AudioContext();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const playSound = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.1;

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, []);

  const playSuccess = useCallback(() => {
    if (!audioContextRef.current) return;
    playSound(800, 0.1);
    setTimeout(() => playSound(1000, 0.1), 100);
  }, [playSound]);

  const playFailure = useCallback(() => {
    if (!audioContextRef.current) return;
    playSound(300, 0.2);
  }, [playSound]);

  const playRoundComplete = useCallback(() => {
    if (!audioContextRef.current) return;
    playSound(523.25, 0.1); // C5
    setTimeout(() => playSound(659.25, 0.1), 100); // E5
    setTimeout(() => playSound(783.99, 0.2), 200); // G5
  }, [playSound]);

  return {
    initializeAudio,
    playSuccess,
    playFailure,
    playRoundComplete
  };
}
