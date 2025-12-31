# Addition & Subtraction Game

A browser-based math game designed for children to practice one-digit addition and subtraction with adaptive difficulty and multiple player profiles.

## Features

- **10 Difficulty Levels**: Each level has decreasing time limits (10s → 3s)
- **Adaptive Question Selection**: Questions you struggle with appear more frequently
- **Multiple Player Profiles**: Create and manage separate profiles for different players
- **Progress Tracking**: Automatic saving of progress and statistics
- **Child-Friendly UI**: Large numbers, clear feedback, and encouraging messages
- **Fully Static**: No backend required - works entirely in the browser

## How It Works

### Levels
- **Level 1**: 10 seconds per question
- **Level 2**: 9 seconds per question
- **Level 3**: 8 seconds per question
- **Level 4**: 7 seconds per question
- **Level 5**: 6 seconds per question
- **Level 6**: 5 seconds per question
- **Level 7**: 4 seconds per question
- **Level 8**: 3.5 seconds per question
- **Level 9**: 3 seconds per question
- **Level 10**: 3 seconds per question

Each level has 10 questions. You need to answer 100% correctly to unlock the next level.

### Problems Covered
The game includes:
- **Addition**: All combinations from 0+0 to 9+9 (100 problems)
- **Subtraction**: All combinations where the result is positive, from 1-0 to 9-9 (55 problems)
- All numbers are single digits (0-9)
- All subtraction results are positive (e.g., 7-2, not 2-7)

### Adaptive Difficulty
The game tracks your performance for each problem (e.g., "5+3" or "7-2"). Problems you get wrong more often will appear more frequently in future questions, especially at higher levels. This helps you practice the ones you need to work on most.

### Data Storage
All data is stored locally in your browser using LocalStorage:
- Player profiles
- Current level for each profile
- Statistics for each problem (correct/wrong counts)
- Last played timestamp

## Getting Started

### Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. No build process or server required!

### File Structure

```
sumapp/
├── index.html      # Main HTML file
├── style.css       # Styling
├── main.js         # Game flow and UI
├── gameLogic.js    # Game mechanics and adaptive difficulty
├── profiles.js     # Profile management
├── storage.js      # LocalStorage handling
├── keyboard.js     # Virtual keyboard component
├── analytics.js    # Analytics dashboard (admin)
└── README.md       # This file
```

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Push all files to the repository
3. Go to repository Settings → Pages
4. Select the branch (usually `main` or `master`)
5. Select the folder (usually `/root`)
6. Click Save
7. Your game will be available at `https://[username].github.io/[repository-name]`

### Alternative: Using a `/docs` folder

If you prefer to use a `/docs` folder:
1. Create a `docs` folder in your repository
2. Move all files into the `docs` folder
3. In GitHub Pages settings, select `/docs` as the source

## Game Flow

1. **Menu**: Start screen with "Start Game" button
2. **Profile Selection**: Create a new profile or select an existing one
3. **Game Play**: 
   - Answer addition and subtraction questions within the time limit
   - Get immediate feedback on each answer
   - Progress through questions in the level
4. **Level Complete**: 
   - See your results
   - If you passed (100%), unlock the next level
   - If you didn't pass, try again to improve

## Customization

### Adjusting Success Threshold
In `gameLogic.js`, modify the `successThreshold` value:
```javascript
successThreshold: 1.0, // Change to 0.7 for 70%, 0.8 for 80%, 0.9 for 90%, etc.
```

### Adjusting Time Limits
In `gameLogic.js`, modify the `levels` array:
```javascript
levels: [
  { level: 1, timeLimitSeconds: 10, questionsPerLevel: 10 },
  // ... modify timeLimitSeconds for each level
]
```

### Adjusting Questions Per Level
In the same `levels` array, modify `questionsPerLevel`:
```javascript
{ level: 1, timeLimitSeconds: 10, questionsPerLevel: 15 }, // 15 questions instead of 10
```

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- LocalStorage API
- CSS3 (flexbox, gradients)

Tested in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Free to use and modify for personal or educational purposes.

## Credits

Created as a static web application for practicing one-digit addition and subtraction with adaptive learning.

