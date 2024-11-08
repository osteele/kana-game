import { Kana } from "../kana/kana";

interface AnswerColumnsProps {
  choices: Kana[];
  position: { x: number };
  currentKana: Kana | null;
  isShowingFeedback: boolean;
  onColumnClick: (index: number) => void;
}

export const AnswerColumns = ({
  choices,
  position,
  currentKana,
  isShowingFeedback,
  onColumnClick,
}: AnswerColumnsProps) => (
  <div className="absolute bottom-0 left-0 right-0">
    <div className="grid grid-cols-5 gap-4 relative p-4">
      <div className="absolute inset-0 bg-gray-50 rounded-xl -z-10" />
      {choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => onColumnClick(index)}
          className={`
            relative p-4 text-xl rounded-lg
            transition-all duration-300
            hover:scale-105 hover:shadow-lg
            active:scale-95
            ${isShowingFeedback ? "pointer-events-none" : ""}
            ${
              isShowingFeedback && currentKana?.romaji === choice.romaji
                ? "bg-green-100 animate-correct-answer ring-2 ring-green-500"
                : isShowingFeedback &&
                  index === Math.floor((position.x / 100) * 5)
                ? "bg-red-100 animate-wrong-answer ring-2 ring-red-500"
                : index === Math.floor((position.x / 100) * 5)
                ? "bg-blue-100"
                : "bg-white hover:bg-blue-50"
            }
          `}
        >
          <span className="hidden sm:block absolute bottom-1 left-2 text-xs font-mono text-gray-400">
            {index + 1}
          </span>
          {choice.romaji}
        </button>
      ))}
    </div>
  </div>
);
