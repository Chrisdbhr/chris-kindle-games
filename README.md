# Chris Kindle Games

A collection of web-based games specifically designed and optimized for the experimental browser found on legacy Kindle E-readers (e.g., Kindle Paperwhite 10th Gen).

## Included Games

- Battleship
- Hangman
- Memory
- Sudoku
- TicTacToe
- Word Search

## Architecture and Technical Constraints

This project follows strict development guidelines to ensure compatibility with the archaic WebKit engine used in Kindle devices.

- **Strict ES5 JavaScript**: No `let`, `const`, or arrow functions are allowed. The browser engine will ignore or crash files containing ES6+ syntax.
- **Legacy CSS**: CSS variables and many modern properties are unsupported. All colors and styles are hardcoded.
- **E-Ink Optimization**: Specific techniques are used to mitigate ghosting, such as "Flash Clear" (hiding text before changing backgrounds) and avoiding heavy gradients.
- **Layout Stability**: Grid systems include manual row clearing and placeholder content to prevent height collapse, a common bug in the Kindle's browser.
- **Native Offline Support**: Uses the deprecated HTML5 Application Cache (`manifest.appcache`) for offline functionality, as modern Service Workers are not supported.
- **Responsiveness**: Hardcoded for 600px widths, with overarching scaling applied for mobile device compatibility.

## Usage

The games are designed to be served via a simple web server (e.g., Nginx) and accessed directly through the Kindle's Experimental Browser.
