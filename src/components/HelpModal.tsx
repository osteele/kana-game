interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal = ({ onClose }: HelpModalProps) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
      <h2 className="text-xl font-bold mb-4">How to Play</h2>
      <div className="space-y-3">
        <p>
          Match the falling kana character with its correct romaji
          pronunciation.
        </p>

        <div className="font-bold mt-2">Controls:</div>
        <ul className="list-disc pl-5">
          <li>
            Use <span className="font-mono">←</span> and{" "}
            <span className="font-mono">→</span> arrow keys to move left and
            right
          </li>
          <li>
            Use number keys <span className="font-mono">1-5</span> to move to
            specific columns
          </li>
          <li>
            Press letter keys to jump to matching answers (e.g. press 'k' to
            cycle through columns starting with 'k')
          </li>
          <li>Click or tap on a column to move there</li>
          <li>Click or tap on the current column to drop instantly</li>
          <li>
            Press <span className="font-mono">Space</span> to drop the character
            or start the next round
          </li>
          <li>
            Press <span className="font-mono">?</span> to show this help
          </li>
          <li>
            Press <span className="font-mono">Esc</span> to close this help
          </li>
        </ul>

        <div className="font-bold mt-2">Tips:</div>
        <ul className="list-disc pl-5">
          <li>The game pauses automatically when opening settings</li>
          <li>Use the pause button (⏸️) to take a break</li>
          <li>Practice with easier levels first to learn the characters</li>
          <li>Use letter keys to quickly navigate between similar answers</li>
        </ul>
      </div>
      <button
        onClick={onClose}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
      >
        Got it!
      </button>
    </div>
  </div>
);
