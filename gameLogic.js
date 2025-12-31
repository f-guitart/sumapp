/**
 * Game logic for addition and subtraction game
 * Handles question generation, adaptive difficulty, and level management
 */

const GameLogic = {
  /**
   * Level configuration
   * Each level has time limit and number of questions
   */
  levels: [
    { level: 1, timeLimitSeconds: 10, questionsPerLevel: 10 },
    { level: 2, timeLimitSeconds: 9, questionsPerLevel: 10 },
    { level: 3, timeLimitSeconds: 8, questionsPerLevel: 10 },
    { level: 4, timeLimitSeconds: 7, questionsPerLevel: 10 },
    { level: 5, timeLimitSeconds: 6, questionsPerLevel: 10 },
    { level: 6, timeLimitSeconds: 5, questionsPerLevel: 10 },
    { level: 7, timeLimitSeconds: 4, questionsPerLevel: 10 },
    { level: 8, timeLimitSeconds: 3.5, questionsPerLevel: 10 },
    { level: 9, timeLimitSeconds: 3, questionsPerLevel: 10 },
    { level: 10, timeLimitSeconds: 3, questionsPerLevel: 10 }
  ],

  /**
   * Success criteria: percentage of correct answers needed to pass
   */
  successThreshold: 1.0, // 100%

  /**
   * Generate all possible one-digit addition and subtraction problems
   * Addition: 0+0 to 9+9 (ensuring positive results)
   * Subtraction: 1-0 to 9-0 (ensuring positive results, minuend >= subtrahend)
   */
  getAllProblems() {
    const problems = [];
    
    // Generate all additions (0-9 + 0-9)
    for (let a = 0; a <= 9; a++) {
      for (let b = 0; b <= 9; b++) {
        problems.push({ a, b, operation: '+' });
      }
    }
    
    // Generate all subtractions (1-9 - 0-9, ensuring result is positive)
    for (let a = 1; a <= 9; a++) {
      for (let b = 0; b <= a; b++) {
        problems.push({ a, b, operation: '-' });
      }
    }
    
    return problems;
  },

  /**
   * Get problem key string
   */
  getProblemKey(a, b, operation) {
    return `${a}${operation}${b}`;
  },

  /**
   * Calculate weight for a problem based on wrong answers and level
   */
  calculateWeight(problemKey, stats, level) {
    const stat = stats[problemKey] || { correct: 0, wrong: 0 };
    const wrongAnswers = stat.wrong || 0;
    
    // Difficulty factor increases with level (1.0 to 2.0)
    const difficultyFactor = 1.0 + (level - 1) * 0.1;
    
    // Base weight is 1, increases with wrong answers
    const weight = 1 + wrongAnswers * difficultyFactor;
    
    return weight;
  },

  /**
   * Generate weighted pool of problems for selection
   */
  generateWeightedPool(profileName, level) {
    const allProblems = this.getAllProblems();
    const stats = Profiles.getStats(profileName);
    const weightedPool = [];

    allProblems.forEach(({ a, b, operation }) => {
      const key = this.getProblemKey(a, b, operation);
      const weight = this.calculateWeight(key, stats, level);
      
      // Add problem to pool multiple times based on weight
      // Round weight to ensure we have integer entries
      const entries = Math.max(1, Math.round(weight * 10));
      for (let i = 0; i < entries; i++) {
        weightedPool.push({ a, b, operation, key });
      }
    });

    return weightedPool;
  },

  /**
   * Select a random problem from weighted pool
   */
  selectRandomQuestion(profileName, level) {
    const pool = this.generateWeightedPool(profileName, level);
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  },

  /**
   * Get level configuration
   */
  getLevelConfig(level) {
    return this.levels.find(l => l.level === level) || this.levels[0];
  },

  /**
   * Check if answer is correct
   */
  checkAnswer(a, b, operation, userAnswer) {
    if (operation === '+') {
      return userAnswer === a + b;
    } else if (operation === '-') {
      return userAnswer === a - b;
    }
    return false;
  },

  /**
   * Generate questions for a level
   */
  generateQuestions(profileName, level) {
    const config = this.getLevelConfig(level);
    const questions = [];

    for (let i = 0; i < config.questionsPerLevel; i++) {
      const question = this.selectRandomQuestion(profileName, level);
      questions.push({
        ...question,
        questionNumber: i + 1,
        totalQuestions: config.questionsPerLevel
      });
    }

    return questions;
  },

  /**
   * Calculate level completion status
   */
  calculateLevelResult(correctCount, totalQuestions) {
    const percentage = correctCount / totalQuestions;
    const passed = percentage >= this.successThreshold;
    
    return {
      passed,
      percentage: Math.round(percentage * 100),
      correctCount,
      totalQuestions
    };
  },

  /**
   * Get next level (if passed)
   */
  getNextLevel(currentLevel) {
    if (currentLevel < this.levels.length) {
      return currentLevel + 1;
    }
    return currentLevel; // Already at max level
  },

  /**
   * Format time remaining for display
   */
  formatTime(seconds) {
    return Math.ceil(seconds).toString();
  }
};

