import { useCallback, useEffect, useState } from "react";

export const useSpeechSynthesis = () => {
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesis | null>(null);
  const [japaneseVoice, setJapaneseVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(() => {
    const saved = localStorage.getItem("kanaGameSpeech");
    return saved ? saved === "true" : true;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSynth(window.speechSynthesis);

      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(
          (voice) =>
            voice.lang.startsWith("ja") ||
            voice.name.toLowerCase().includes("japanese")
        );
        setJapaneseVoice(jaVoice || null);
      };

      handleVoicesChanged();
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged
      );

      return () => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
      };
    }
  }, []);

  const speakKana = useCallback(
    (text: string) => {
      try {
        if (!speechEnabled) return;
        if (speechSynth && !speechSynth.speaking) {
          const utterance = new SpeechSynthesisUtterance(text);
          if (japaneseVoice) {
            utterance.voice = japaneseVoice;
          }
          utterance.lang = "ja-JP";
          utterance.rate = 0.8;
          speechSynth.speak(utterance);
        }
      } catch (err) {
        console.error("Speech synthesis error:", err);
      }
    },
    [speechSynth, japaneseVoice, speechEnabled]
  );

  return { speechEnabled, setSpeechEnabled, speakKana };
};
