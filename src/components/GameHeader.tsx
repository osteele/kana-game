import {
  Clock,
  HelpCircle,
  Pause,
  Play,
  Settings as SettingsIcon,
} from "lucide-react";

interface GameHeaderProps {
  elapsedTime: number;
  score: { correct: number; wrong: number };
  isPlaying: boolean;
  isGamePaused: boolean;
  onTogglePause: () => void;
  onToggleHelp: () => void;
  onToggleSettings: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const GameHeader = ({
  elapsedTime,
  score,
  isPlaying,
  isGamePaused,
  onTogglePause,
  onToggleHelp,
  onToggleSettings,
}: GameHeaderProps) => (
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
          onClick={onTogglePause}
          className="p-2 rounded hover:bg-gray-100"
          tabIndex={-1}
        >
          {isGamePaused ? (
            <Play className="w-5 h-5" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
        </button>
      )}
      <button
        onClick={onToggleHelp}
        className="p-2 rounded hover:bg-gray-100"
        aria-label="Help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
      <button
        onClick={onToggleSettings}
        className="p-2 rounded hover:bg-gray-100"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
);
