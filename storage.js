/**
 * LocalStorage management for addition and subtraction game
 * Handles all data persistence for profiles and game state
 */

const Storage = {
  /**
   * Initialize storage with default structure if needed
   */
  init() {
    // Use separate storage key for addition/subtraction game
    // This ensures it doesn't share data with the multiplication game
    if (!localStorage.getItem('sumappGame')) {
      const defaultData = {
        profiles: {},
        currentProfile: null
      };
      localStorage.setItem('sumappGame', JSON.stringify(defaultData));
    }
  },

  /**
   * Get all stored data
   */
  getData() {
    const data = localStorage.getItem('sumappGame');
    return data ? JSON.parse(data) : { profiles: {}, currentProfile: null };
  },

  /**
   * Save all data
   */
  saveData(data) {
    localStorage.setItem('sumappGame', JSON.stringify(data));
  },

  /**
   * Get all profiles
   */
  getProfiles() {
    const data = this.getData();
    return data.profiles || {};
  },

  /**
   * Get a specific profile
   */
  getProfile(profileName) {
    const profiles = this.getProfiles();
    return profiles[profileName] || null;
  },

  /**
   * Save a profile
   */
  saveProfile(profileName, profileData) {
    const data = this.getData();
    if (!data.profiles) {
      data.profiles = {};
    }
    data.profiles[profileName] = profileData;
    this.saveData(data);
  },

  /**
   * Get current profile name
   */
  getCurrentProfile() {
    const data = this.getData();
    return data.currentProfile;
  },

  /**
   * Set current profile
   */
  setCurrentProfile(profileName) {
    const data = this.getData();
    data.currentProfile = profileName;
    this.saveData(data);
  },

  /**
   * Create a new profile with default values
   */
  createProfile(profileName) {
    const newProfile = {
      level: 1,
      stats: {},
      lastPlayed: new Date().toISOString(),
      sessions: [],
      quizzes: []
    };
    this.saveProfile(profileName, newProfile);
    return newProfile;
  },

  /**
   * Update profile level
   */
  updateProfileLevel(profileName, level) {
    const profile = this.getProfile(profileName);
    if (profile) {
      profile.level = level;
      profile.lastPlayed = new Date().toISOString();
      this.saveProfile(profileName, profile);
    }
  },

  /**
   * Update problem stats for a profile
   */
  updateStats(profileName, problemKey, isCorrect) {
    const profile = this.getProfile(profileName);
    if (!profile) return;

    if (!profile.stats) {
      profile.stats = {};
    }

    if (!profile.stats[problemKey]) {
      profile.stats[problemKey] = { correct: 0, wrong: 0 };
    }

    if (isCorrect) {
      profile.stats[problemKey].correct++;
    } else {
      profile.stats[problemKey].wrong++;
    }

    profile.lastPlayed = new Date().toISOString();
    this.saveProfile(profileName, profile);
  },

  /**
   * Delete a profile
   */
  deleteProfile(profileName) {
    const data = this.getData();
    if (data.profiles && data.profiles[profileName]) {
      delete data.profiles[profileName];
      if (data.currentProfile === profileName) {
        data.currentProfile = null;
      }
      this.saveData(data);
    }
  },

  /**
   * Start a new session
   */
  startSession(profileName) {
    const profile = this.getProfile(profileName);
    if (!profile) return null;

    if (!profile.sessions) {
      profile.sessions = [];
    }

    const session = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      endTime: null,
      quizzes: []
    };

    profile.sessions.push(session);
    profile.lastPlayed = new Date().toISOString();
    this.saveProfile(profileName, profile);
    return session;
  },

  /**
   * End current session
   */
  endSession(profileName) {
    const profile = this.getProfile(profileName);
    if (!profile || !profile.sessions || profile.sessions.length === 0) return;

    const currentSession = profile.sessions[profile.sessions.length - 1];
    if (currentSession && !currentSession.endTime) {
      currentSession.endTime = new Date().toISOString();
      this.saveProfile(profileName, profile);
    }
  },

  /**
   * Start a new quiz (level attempt)
   */
  startQuiz(profileName, level) {
    const profile = this.getProfile(profileName);
    if (!profile) return null;

    if (!profile.sessions || profile.sessions.length === 0) {
      this.startSession(profileName);
    }

    if (!profile.quizzes) {
      profile.quizzes = [];
    }

    const session = profile.sessions[profile.sessions.length - 1];
    const quiz = {
      id: Date.now().toString(),
      level: level,
      startTime: new Date().toISOString(),
      endTime: null,
      questions: [],
      passed: false,
      correctCount: 0,
      totalQuestions: 0
    };

    profile.quizzes.push(quiz);
    if (session && !session.quizzes) {
      session.quizzes = [];
    }
    if (session) {
      session.quizzes.push(quiz.id);
    }
    this.saveProfile(profileName, profile);
    return quiz;
  },

  /**
   * End current quiz
   */
  endQuiz(profileName, passed, correctCount, totalQuestions) {
    const profile = this.getProfile(profileName);
    if (!profile || !profile.quizzes || profile.quizzes.length === 0) return;

    const currentQuiz = profile.quizzes[profile.quizzes.length - 1];
    if (currentQuiz && !currentQuiz.endTime) {
      currentQuiz.endTime = new Date().toISOString();
      currentQuiz.passed = passed;
      currentQuiz.correctCount = correctCount;
      currentQuiz.totalQuestions = totalQuestions;
      this.saveProfile(profileName, profile);
    }
  }
};

// Initialize storage on load
Storage.init();

