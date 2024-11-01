# Kana Learning Game

An interactive game for learning Japanese hiragana characters. The game presents falling kana characters that players must guide to the correct romanization at the bottom of the screen.

## Features

- Interactive falling kana characters
- Touch and keyboard controls
- Progress tracking and local save system
- Multiple difficulty levels
- Session timer and score tracking
- Responsive design for both desktop and mobile

## Prerequisites

- [Bun](https://bun.sh/) or Node.js installed on your system
- Basic familiarity with terminal/command line

## Installation

1. Clone or download this repository:
```bash
git clone <repository-url>
cd kana-game
```

2. Install dependencies:
```bash
bun install
# or if using npm
npm install
```

3. Start the development server:
```bash
bun run dev
# or if using npm
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal)

## How to Play

- **Desktop Controls:**
  - Use left and right arrow keys to move the falling kana
  - Space bar to start new character after feedback (optional)

- **Mobile Controls:**
  - Tap the romaji columns at the bottom to guide the kana

- **Gameplay:**
  - A hiragana character falls from the top of the screen
  - Guide it to the column with the matching romaji (romanized) pronunciation
  - Correct matches increase your score
  - The game saves your progress locally
  - Access settings via the gear icon to change difficulty level

## Project Structure

```
kana-game/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    └── components/
        └── KanaGame.jsx
```

## Technology Stack

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Icon components

## Development

The project uses Vite for fast development with HMR (Hot Module Replacement). All changes to the source files will be immediately reflected in the browser.

To build for production:
```bash
bun run build
# or if using npm
npm run build
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

Planned features and improvements:

- Additional kana sets (katakana, compound characters)
- Sound effects for feedback
- Particle effects for correct/incorrect answers
- Statistics tracking and performance graphs
- Customizable game speed
- Challenge modes
- Multi-language support
