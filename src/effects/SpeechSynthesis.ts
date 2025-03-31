import { useCallback, useEffect, useState } from "react";
import { 
  getVoiceProvider,
  VoiceProvider
} from "speech-provider";

export interface VoiceOption {
  id: string;
  name: string;
  provider: "browser" | "elevenlabs";
  language: string;
  supportsJapanese: boolean;
  originalVoice?: any; // Reference to original browser voice for lookup
}

// Helper function to check if a voice supports Japanese
const supportsJapanese = (voice: any): boolean => {
  return Boolean(
    (voice.lang && typeof voice.lang === 'string' && /^ja|japan/i.test(voice.lang)) || 
    (voice.name && /japan/i.test(voice.name))
  );
};

export const useSpeechSynthesis = () => {
  const [speechSynth, setSpeechSynth] = useState<SpeechSynthesis | null>(null);
  const [japaneseVoice, setJapaneseVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(() => {
    const saved = localStorage.getItem("kanaGameSpeech");
    return saved ? saved === "true" : true;
  });
  
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("elevenLabsApiKey") || "";
  });
  
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem("selectedVoice") || "browser-default";
  });
  
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider | null>(null);

  // Initialize browser speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSynth(window.speechSynthesis);

      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        // Find a Japanese voice using the helper function
        const jaVoice = voices.find(supportsJapanese);
        setJapaneseVoice(jaVoice || null);
        
        // Add all browser voices to options, deduplicating by name
        const seenVoiceNames = new Set<string>();
        const browserVoices: VoiceOption[] = voices
          .map(voice => {
            // Get clean name without language info
            const cleanName = voice.name.split('(')[0].trim();
            // Use the helper function to check for Japanese support
            const supportsJapaneseLanguage = supportsJapanese(voice);
            
            // Create a unique ID using the clean name
            const id = `browser-${cleanName}`;
            
            return {
              id,
              name: cleanName,
              provider: "browser" as const,
              language: voice.lang,
              supportsJapanese: supportsJapaneseLanguage,
              originalVoice: voice // Keep reference to the original voice
            };
          })
          // Filter out duplicates by name, prioritizing Japanese voices
          .sort((a, b) => {
            // Sort by Japanese support (Japanese first)
            if (a.supportsJapanese && !b.supportsJapanese) return -1;
            if (!a.supportsJapanese && b.supportsJapanese) return 1;
            // Then by name
            return a.name.localeCompare(b.name);
          })
          .filter(voice => {
            // If we've seen this clean name before, skip it
            if (seenVoiceNames.has(voice.name)) {
              return false;
            }
            // Otherwise, add it to the set and keep it
            seenVoiceNames.add(voice.name);
            return true;
          });
        
        setAvailableVoices(prevVoices => {
          // Filter out browser voices and add new ones
          const nonBrowserVoices = prevVoices.filter(v => v.provider !== "browser");
          // Sort by Japanese support (Japanese voices first)
          const sortedVoices = [...browserVoices, ...nonBrowserVoices].sort(
            (a, b) => (b.supportsJapanese ? 1 : 0) - (a.supportsJapanese ? 1 : 0)
          );
          return sortedVoices;
        });
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
  
  // Initialize speech provider
  useEffect(() => {
    const initProvider = async () => {
      // Initialize the voice provider
      const provider = getVoiceProvider({
        elevenLabsApiKey: apiKey || null
      });
      
      setVoiceProvider(provider);
      
      // If we have an ElevenLabs API key, fetch available voices
      if (apiKey) {
        // Get all voices, not just Japanese ones
        const allVoices = await provider.getVoices({ 
          lang: "", 
          minVoices: 1 
        });
        
        // Filter for ElevenLabs voices by checking if provider name is not 'browser'
        const elVoices: VoiceOption[] = allVoices
          .filter(voice => voice.provider.name !== 'browser')
          .map(voice => {
            // Use the helper function
            const supportsJapaneseLanguage = supportsJapanese(voice);
            return {
              id: `elevenlabs-${voice.id}`,
              name: voice.name.split('(')[0].trim(),
              provider: "elevenlabs",
              language: voice.lang || "unknown",
              supportsJapanese: supportsJapaneseLanguage
            };
          });
          
        setAvailableVoices(prevVoices => {
          // Filter out elevenlabs voices and add new ones
          const nonElevenLabsVoices = prevVoices.filter(v => v.provider !== "elevenlabs");
          // Sort by Japanese support
          const sortedVoices = [...nonElevenLabsVoices, ...elVoices].sort(
            (a, b) => (b.supportsJapanese ? 1 : 0) - (a.supportsJapanese ? 1 : 0)
          );
          return sortedVoices;
        });
      }
    };
    
    initProvider();
  }, [apiKey]);
  
  useEffect(() => {
    localStorage.setItem("kanaGameSpeech", speechEnabled.toString());
  }, [speechEnabled]);
  
  useEffect(() => {
    localStorage.setItem("elevenLabsApiKey", apiKey);
  }, [apiKey]);
  
  useEffect(() => {
    localStorage.setItem("selectedVoice", selectedVoice);
  }, [selectedVoice]);

  const speakKana = useCallback(
    async (text: string) => {
      if (!speechEnabled) return;
      
      // Parse selectedVoice format: "provider-id"
      const [providerType, ...idParts] = selectedVoice.split("-");
      const voiceId = idParts.join("-"); // In case the voice ID itself contains hyphens
      
      if (providerType === "browser") {
        if (speechSynth && !speechSynth.speaking) {
          const utterance = new SpeechSynthesisUtterance(text);
          if (japaneseVoice) {
            utterance.voice = japaneseVoice;
          }
          utterance.lang = "ja-JP";
          utterance.rate = 0.8;
          speechSynth.speak(utterance);
        }
      } else if (providerType === "elevenlabs" && apiKey && voiceProvider) {
        // Get all voices
        const voices = await voiceProvider.getVoices({ 
          lang: "ja-JP", 
          minVoices: 1 
        });
        
        // Find the voice by ID
        const voice = voices.find((v) => v.id === voiceId);
        
        if (voice) {
          // Create and play the utterance
          const utterance = voice.createUtterance(text);
          utterance.start();
        }
      }
    },
    [speechSynth, japaneseVoice, speechEnabled, voiceProvider, selectedVoice, apiKey]
  );

  // Add a function to speak a sample sentence
  const speakSample = useCallback(
    async (voiceId: string) => {
      // Don't try to speak if the voice ID is empty
      if (!voiceId || voiceId === '') return;
      
      // Sample Japanese sentence
      const sampleText = "こんにちは、お元気ですか？";
      
      // Parse voice ID
      const [providerType, ...idParts] = voiceId.split("-");
      const voiceIdPart = idParts.join("-");
      
      if (providerType === "browser") {
        if (speechSynth) {
          const utterance = new SpeechSynthesisUtterance(sampleText);
          
          // Find the voice option first
          const voiceOption = availableVoices.find(v => v.id === voiceId);
          
          // Use the original voice if available, otherwise try to find by clean name
          const voice = voiceOption?.originalVoice || 
            speechSynth.getVoices().find(v => {
              const cleanName = v.name.split('(')[0].trim();
              return `browser-${cleanName}` === voiceId;
            });
          
          if (voice) {
            utterance.voice = voice;
          }
          utterance.lang = "ja-JP";
          utterance.rate = 0.8;
          speechSynth.speak(utterance);
        }
      } else if (providerType === "elevenlabs" && apiKey && voiceProvider) {
        // Get all voices
        const voices = await voiceProvider.getVoices({ 
          lang: "", 
          minVoices: 1 
        });
        
        // Find the voice by ID
        const voice = voices.find((v) => v.id === voiceIdPart);
        
        if (voice) {
          // Create and play the utterance
          const utterance = voice.createUtterance(sampleText);
          utterance.start();
        }
      }
    },
    [speechSynth, voiceProvider, apiKey]
  );

  return { 
    speechEnabled, 
    setSpeechEnabled, 
    speakKana,
    apiKey,
    setApiKey,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    speakSample
  };
};