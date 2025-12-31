/**
 * Main game controller
 * Handles game flow, UI updates, and user interactions
 */

const Game = {
  currentProfile: null,
  currentLevel: 1,
  currentQuestion: null,
  questions: [],
  currentQuestionIndex: 0,
  correctCount: 0,
  timer: null,
  feedbackTimeout: null,
  timeRemaining: 0,
  currentSession: null,
  currentQuiz: null,
  gameState: 'menu', // 'menu', 'profile-selection', 'playing', 'level-complete', 'game-complete', 'analytics', 'profile-detail'

  /**
   * Initialize the game
   */
  init() {
    this.showProfileSelection();
    this.setupEventListeners();
  },

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle profile selection callback
    window.onProfileSelected = () => {
      this.startGame();
    };
    // Handle admin profile selection callback
    window.onAdminSelected = () => {
      this.showAnalytics();
    };
  },

  /**
   * Show main menu
   */
  showMenu() {
    // Clean up any running timers or timeouts
    this.stopTimer();
    this.clearFeedbackTimeout();
    this.gameState = 'menu';
    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div class="menu-screen">
        <h1 class="game-title">Addition & Subtraction Game</h1>
        <button class="btn btn-primary btn-large" onclick="Game.showProfileSelection()">
          Start Game
        </button>
      </div>
    `;
  },

  /**
   * Show profile selection screen
   */
  showProfileSelection() {
    // Clean up any running timers
    this.stopTimer();
    this.clearFeedbackTimeout();
    this.gameState = 'profile-selection';
    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div class="profile-screen">
        <h2>Select or Create Profile</h2>
        <div id="profile-selection-container"></div>
      </div>
    `;
    
    Profiles.renderProfileSelection(document.getElementById('profile-selection-container'));
  },

  /**
   * Show analytics screen (admin only)
   */
  showAnalytics() {
    // Clean up any running timers
    this.stopTimer();
    this.clearFeedbackTimeout();
    this.gameState = 'analytics';
    const container = document.getElementById('game-container');
    Analytics.render(container);
  },

  /**
   * Start the game with current profile
   */
  startGame() {
    const profile = Profiles.getCurrent();
    if (!profile) {
      alert('Please select or create a profile first');
      this.showProfileSelection();
      return;
    }

    const profileName = Storage.getCurrentProfile();
    // Redirect admin to analytics
    if (Analytics.isAdmin(profileName)) {
      this.showAnalytics();
      return;
    }

    this.currentProfile = profileName;
    this.currentLevel = profile.level;
    this.gameState = 'playing';
    this.startLevel();
  },

  /**
   * Start a level
   */
  startLevel() {
    this.currentQuestionIndex = 0;
    this.correctCount = 0;
    this.questions = GameLogic.generateQuestions(this.currentProfile, this.currentLevel);
    // Start session if not already started
    if (!this.currentSession) {
      this.currentSession = Storage.startSession(this.currentProfile);
    }
    // Start quiz
    this.currentQuiz = Storage.startQuiz(this.currentProfile, this.currentLevel);
    this.loadNextQuestion();
  },

  /**
   * Load the next question
   */
  loadNextQuestion() {
    // Stop any existing timer first
    this.stopTimer();
    this.clearFeedbackTimeout();
    
    if (this.currentQuestionIndex >= this.questions.length) {
      this.completeLevel();
      return;
    }

    this.currentQuestion = this.questions[this.currentQuestionIndex];
    const config = GameLogic.getLevelConfig(this.currentLevel);
    this.timeRemaining = config.timeLimitSeconds;

    this.renderQuestion();
    this.startTimer();
  },

  /**
   * Render the current question
   */
  renderQuestion() {
    const container = document.getElementById('game-container');
    const { a, b, operation, questionNumber, totalQuestions } = this.currentQuestion;
    const config = GameLogic.getLevelConfig(this.currentLevel);
    
    // Show questions answered so far (1 to 10)
    const questionsAnswered = questionNumber;

    // Get player's highest achieved level (levels below current are achieved)
    const profile = Profiles.getCurrent();
    const playerLevel = profile ? profile.level : 1;

    container.innerHTML = `
      <div class="game-screen">
        <div class="game-header">
          <div class="level-info">Level ${this.currentLevel}</div>
          <div class="question-info">Question ${questionNumber} / ${totalQuestions}</div>
          <div class="score-info">Correct: ${this.correctCount} / ${questionsAnswered}</div>
        </div>
        
        <div class="levels-indicator">
          ${GameLogic.levels.map((level, index) => {
            const levelNum = index + 1;
            const isAchieved = levelNum < this.currentLevel;
            const isCurrent = levelNum === this.currentLevel;
            const isLocked = levelNum > playerLevel;
            
            return `
              <div class="level-circle ${isAchieved ? 'achieved' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}" 
                   title="Level ${levelNum}">
                ${levelNum}
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="timer-container">
          <div class="timer" id="timer-display">${GameLogic.formatTime(this.timeRemaining)}s</div>
        </div>

        <div class="question-container">
          <div class="question">
            <span class="number">${a}</span>
            <span class="operator">${operation}</span>
            <span class="number">${b}</span>
            <span class="equals">=</span>
            <span class="answer-input-container">
              <input type="number" id="answer-input" class="answer-input" autofocus />
            </span>
            <span id="feedback-emoji" class="feedback-emoji"></span>
          </div>
        </div>

        <div class="answer-buttons">
          <button class="btn btn-primary btn-large" onclick="Game.submitAnswer()">Submit</button>
        </div>

        <div id="keyboard-container"></div>

        <div class="game-footer">
          <button class="btn btn-secondary" onclick="Game.quitGame()">Quit</button>
        </div>
      </div>
    `;

    // Render virtual keyboard
    const keyboardContainer = document.getElementById('keyboard-container');
    if (keyboardContainer) {
      VirtualKeyboard.render(keyboardContainer);
      // Always show keyboard (works on both touch and desktop)
      VirtualKeyboard.show();
    }

    // Focus input and allow Enter key
    const input = document.getElementById('answer-input');
    if (input) {
      const isTouchDevice = VirtualKeyboard.isTouchDevice();
      
      // Prevent mobile keyboard from showing on touch devices when virtual keyboard is shown
      if (isTouchDevice) {
        // Use inputmode="none" to prevent mobile keyboard
        input.setAttribute('inputmode', 'none');
        input.setAttribute('readonly', 'readonly');
        
        // Allow physical keyboard if user taps and holds (for tablets with keyboards)
        let touchStartTime = 0;
        input.addEventListener('touchstart', (e) => {
          touchStartTime = Date.now();
        });
        
        input.addEventListener('touchend', (e) => {
          const touchDuration = Date.now() - touchStartTime;
          // Long press (500ms+) enables physical keyboard
          if (touchDuration > 500) {
            input.removeAttribute('readonly');
            input.removeAttribute('inputmode');
            input.focus();
          }
        });
      }
      
      // Focus input (won't show keyboard if readonly on touch devices)
      if (!isTouchDevice) {
        input.focus();
      }
      
      // Handle Enter key
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.submitAnswer();
        }
      });
      
      // Allow physical keyboard input and sanitize
      input.addEventListener('input', (e) => {
        // Ensure only numbers are entered
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });
      
      // Handle physical keyboard number keys
      input.addEventListener('keydown', (e) => {
        // Allow numbers, backspace, delete, arrow keys, tab, enter
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'];
        const isNumber = e.key >= '0' && e.key <= '9';
        if (!isNumber && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      });
    }
  },

  /**
   * Start the countdown timer
   */
  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.timeRemaining -= 0.1;
      const timerDisplay = document.getElementById('timer-display');
      
      if (timerDisplay) {
        timerDisplay.textContent = `${GameLogic.formatTime(this.timeRemaining)}s`;
        
        // Visual warning when time is running out
        if (this.timeRemaining <= 2) {
          timerDisplay.classList.add('warning');
        } else {
          timerDisplay.classList.remove('warning');
        }
      }

      if (this.timeRemaining <= 0) {
        this.handleTimeout();
      }
    }, 100);
  },

  /**
   * Stop the timer
   */
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  /**
   * Clear feedback timeout
   */
  clearFeedbackTimeout() {
    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
      this.feedbackTimeout = null;
    }
  },

  /**
   * Quit game and return to profile selection
   */
  quitGame() {
    this.stopTimer();
    this.clearFeedbackTimeout();
    // End current quiz and session
    if (this.currentQuiz) {
      Storage.endQuiz(this.currentProfile, false, this.correctCount, this.currentQuestionIndex);
      this.currentQuiz = null;
    }
    if (this.currentSession) {
      Storage.endSession(this.currentProfile);
      this.currentSession = null;
    }
    this.showProfileSelection();
  },

  /**
   * Handle timeout (no answer submitted in time)
   */
  handleTimeout() {
    this.stopTimer();
    const { a, b, operation, key } = this.currentQuestion;
    Storage.updateStats(this.currentProfile, key, false);
    
    const correctAnswer = operation === '+' ? a + b : a - b;
    this.showFeedback(false, correctAnswer);
  },

  /**
   * Submit answer
   */
  submitAnswer() {
    const input = document.getElementById('answer-input');
    if (!input) return;

    const userAnswer = parseInt(input.value, 10);
    if (isNaN(userAnswer)) {
      return;
    }

    this.stopTimer();
    const { a, b, operation, key } = this.currentQuestion;
    const isCorrect = GameLogic.checkAnswer(a, b, operation, userAnswer);
    
    Storage.updateStats(this.currentProfile, key, isCorrect);
    
    if (isCorrect) {
      this.correctCount++;
    }

    const correctAnswer = operation === '+' ? a + b : a - b;
    this.showFeedback(isCorrect, correctAnswer);
  },

  /**
   * Show feedback for answer
   */
  showFeedback(isCorrect, correctAnswer) {
    // Stop timer when showing feedback
    this.stopTimer();
    
    // Show subtle emoji feedback
    const feedbackEmoji = document.getElementById('feedback-emoji');
    if (feedbackEmoji) {
      feedbackEmoji.textContent = isCorrect ? '✓' : '✗';
      feedbackEmoji.className = `feedback-emoji ${isCorrect ? 'correct' : 'incorrect'}`;
      
      // Clear input
      const input = document.getElementById('answer-input');
      if (input) {
        input.value = '';
      }
      
      // Auto-advance after 1 second
      this.feedbackTimeout = setTimeout(() => {
        if (this.gameState === 'playing' && this.currentQuestionIndex < this.questions.length - 1) {
          this.nextQuestion();
        } else if (this.gameState === 'playing') {
          this.completeLevel();
        }
        this.feedbackTimeout = null;
      }, 1000);
    }
  },

  /**
   * Move to next question
   */
  nextQuestion() {
    this.currentQuestionIndex++;
    this.loadNextQuestion();
  },

  /**
   * Complete the current level
   */
  completeLevel() {
    this.stopTimer();
    const result = GameLogic.calculateLevelResult(
      this.correctCount,
      this.questions.length
    );

    // End current quiz
    if (this.currentQuiz) {
      Storage.endQuiz(this.currentProfile, result.passed, result.correctCount, result.totalQuestions);
      this.currentQuiz = null;
    }

    const container = document.getElementById('game-container');
    
    if (result.passed) {
      const nextLevel = GameLogic.getNextLevel(this.currentLevel);
      const isMaxLevel = nextLevel === this.currentLevel;
      
      if (!isMaxLevel) {
        Profiles.updateLevel(this.currentProfile, nextLevel);
      }

      // End session after level completion
      if (this.currentSession) {
        Storage.endSession(this.currentProfile);
        this.currentSession = null;
      }

      container.innerHTML = `
        <div class="level-complete-screen success">
          <h2>Level ${this.currentLevel} Complete! 🎉</h2>
          <div class="result-stats">
            <div class="stat">Correct: ${result.correctCount} / ${result.totalQuestions}</div>
            <div class="stat">Score: ${result.percentage}%</div>
          </div>
          ${!isMaxLevel ? `
            <div class="level-unlock">Level ${nextLevel} Unlocked! 🚀</div>
            <button class="btn btn-primary btn-large" onclick="Game.startGame()">
              Continue to Level ${nextLevel}
            </button>
          ` : `
            <div class="level-unlock">Congratulations! You've completed all levels! 🏆</div>
            <button class="btn btn-primary btn-large" onclick="Game.startGame()">
              Play Again
            </button>
          `}
          <button class="btn btn-secondary" onclick="Game.showProfileSelection()">Back to Profiles</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="level-complete-screen failed">
          <h2>Level ${this.currentLevel} - Keep Practicing!</h2>
          <div class="result-stats">
            <div class="stat">Correct: ${result.correctCount} / ${result.totalQuestions}</div>
            <div class="stat">Score: ${result.percentage}%</div>
            <div class="stat">Need ${Math.ceil(result.totalQuestions * GameLogic.successThreshold)} correct to pass</div>
          </div>
          <div class="encouragement">Don't give up! Practice makes perfect! 💪</div>
          <button class="btn btn-primary btn-large" onclick="Game.startGame()">
            Try Again
          </button>
          <button class="btn btn-secondary" onclick="Game.showProfileSelection()">Back to Profiles</button>
        </div>
      `;
    }
  }
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});

